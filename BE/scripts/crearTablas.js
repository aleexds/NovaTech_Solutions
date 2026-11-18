const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
    try {
        const configRaw = fs.readFileSync(path.join(__dirname, '..', 'config', 'config.json'), 'utf8');
        const config = JSON.parse(configRaw).development;

        console.log(`🔌 Conectando a MySQL en ${config.host} como ${config.username}...`);

        const conn = await mysql.createConnection({
            host: config.host,
            user: config.username,
            password: config.password
        });

        console.log('✅ Conexión con servidor MySQL establecida.');

        // Crear base de datos si no existe
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await conn.query(`USE \`${config.database}\`;`);
        console.log(`📦 Base de datos "${config.database}" seleccionada.`);

        // 1. Tabla colaboradores
        await conn.query(`
            CREATE TABLE IF NOT EXISTS colaboradores (
                id VARCHAR(50) PRIMARY KEY,
                nombre VARCHAR(150) NOT NULL,
                departamento VARCHAR(100) NOT NULL,
                puesto VARCHAR(100) NOT NULL,
                fecha_ingreso DATE NOT NULL,
                jefe_id VARCHAR(50) NULL,
                rol VARCHAR(50) DEFAULT 'colaborador',
                estado VARCHAR(50) DEFAULT 'activo',
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('  -> Tabla colaboradores verificada/creada');

        // 2. Tabla saldos_vacaciones
        await conn.query(`
            CREATE TABLE IF NOT EXISTS saldos_vacaciones (
                id INT AUTO_ID PRIMARY KEY,
                colaborador_id VARCHAR(50) NOT NULL,
                periodo VARCHAR(20) NOT NULL,
                dias_asignados DECIMAL(5,2) DEFAULT 0,
                dias_tomados DECIMAL(5,2) DEFAULT 0,
                dias_disponibles DECIMAL(5,2) DEFAULT 0,
                FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `.replace('AUTO_ID', 'AUTO_INCREMENT'));
        console.log('  -> Tabla saldos_vacaciones verificada/creada');

        // 3. Tabla solicitudes
        await conn.query(`
            CREATE TABLE IF NOT EXISTS solicitudes (
                id VARCHAR(50) PRIMARY KEY,
                colaborador_id VARCHAR(50) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                estado VARCHAR(50) DEFAULT 'pendiente',
                aprobador_id VARCHAR(50) NULL,
                creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('  -> Tabla solicitudes verificada/creada');

        // 4. Tabla incapacidades
        await conn.query(`
            CREATE TABLE IF NOT EXISTS incapacidades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                colaborador_id VARCHAR(50) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                fecha_inicio DATE NOT NULL,
                dias INT NOT NULL,
                entidad VARCHAR(100) NOT NULL,
                creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('  -> Tabla incapacidades verificada/creada');

        // 5. Tabla movimientos_personal
        await conn.query(`
            CREATE TABLE IF NOT EXISTS movimientos_personal (
                id INT AUTO_INCREMENT PRIMARY KEY,
                colaborador_id VARCHAR(50) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                fecha DATE NOT NULL,
                motivo TEXT NULL,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('  -> Tabla movimientos_personal verificada/creada');

        // 6. Tabla consultas_chat (para logs del chatbot y métricas del analista)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS consultas_chat (
                id INT AUTO_INCREMENT PRIMARY KEY,
                colaborador_id VARCHAR(50) NULL,
                pregunta TEXT NOT NULL,
                intencion VARCHAR(50) NULL,
                agente VARCHAR(50) NULL,
                documentos_citados TEXT NULL,
                resuelta BOOLEAN DEFAULT TRUE,
                escalada BOOLEAN DEFAULT FALSE,
                latencia_ms INT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('  -> Tabla consultas_chat verificada/creada');

        // 7. Tabla reportes_diarios
        await conn.query(`
            CREATE TABLE IF NOT EXISTS reportes_diarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fecha DATE NOT NULL UNIQUE,
                datos_json JSON NOT NULL,
                resumen_texto TEXT NOT NULL,
                generado_por VARCHAR(50) DEFAULT 'agente_analista',
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('  -> Tabla reportes_diarios verificada/creada');

        // 8. Tabla documentos_vectorial (para reemplazar Supabase pgvector con indexado relacional + embeddings)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS documentos_vectorial (
                id INT AUTO_INCREMENT PRIMARY KEY,
                archivo_id VARCHAR(100) NOT NULL,
                nombre_documento VARCHAR(255) NOT NULL,
                seccion VARCHAR(255) NULL,
                version VARCHAR(50) NULL,
                enlace_drive TEXT NULL,
                contenido LONGTEXT NOT NULL,
                embedding JSON NULL,
                actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FULLTEXT(contenido, nombre_documento)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('  -> Tabla documentos_vectorial verificada/creada');

        await conn.end();
        console.log('🎉 ¡Todas las tablas fueron creadas exitosamente en MySQL!');
    } catch (error) {
        console.error('❌ Error al inicializar MySQL:', error.message);
        process.exit(1);
    }
}

initDB();
