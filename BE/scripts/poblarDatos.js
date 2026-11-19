const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const nombres = [
  "Carlos Valenzuela", "Ana Sofía Mendoza", "Roberto Gómez", "Lucía Fernández", "Diego Morales",
  "Mariana Torres", "Javier Herrera", "Elena Castro", "Andrés Romero", "Sofía Vargas",
  "Gabriel Silva", "Valentina Rojas", "Fernando Delgado", "Camila Navarro", "Mateo Ríos",
  "Isabella Paredes", "Sebastián Ortega", "Paula Méndez", "Alejandro Vega", "Daniela Castillo",
  "Martín Guerrero", "Catalina Cruz", "Esteban Fuentes", "Renata Soto", "Joaquín Guzmán",
  "Valeria Campos", "Felipe Cárdenas", "Antonella Reyes", "Nicolás Benítez", "Victoria Miranda",
  "Samuel Carrasco", "Florencia Espinoza", "Ignacio Lara", "Emilia Pacheco", "Emilio Salgado",
  "Julieta Molina", "Bruno Santander", "Abril Figueroa", "Lucas Cordero", "Amanda Bravo",
  "Tomás Aguilera", "Mia Villalobos", "Gonzalo Riquelme", "Clara Alarcón", "Maximiliano Peña",
  "Constanza Salazar", "Vicente Godoy", "Josefina Valdés", "Cristóbal Henríquez", "Laura Bustos",
  "Alonso Pizarro", "Fernanda Orellana"
];

const departamentos = ["Tecnología", "Recursos Humanos", "Finanzas", "Operaciones", "Ventas", "Marketing", "Legal"];
const puestos = {
  "Tecnología": ["Senior FullStack Dev", "Cloud Architect", "QA Automation", "DevOps Engineer", "Frontend Specialist"],
  "Recursos Humanos": ["Director de Personas & Cultura", "Especialista de Onboarding", "Analista de Nómina", "Coordinador de Clima"],
  "Finanzas": ["Contador Senior", "Analista Financiero", "Especialista en Tesorería"],
  "Operaciones": ["Gerente de Operaciones", "Coordinador Logístico", "Supervisor de Procesos"],
  "Ventas": ["Account Executive", "Business Developer", "Key Account Manager"],
  "Marketing": ["Growth Hacker", "Content Specialist", "Brand Manager"],
  "Legal": ["Asesor Laboral", "Compliance Officer"]
};

function generarEmail(nombre) {
    return nombre.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '.') + '@novatech.com';
}

async function poblarDatos() {
    try {
        const configRaw = fs.readFileSync(path.join(__dirname, '..', 'config', 'config.json'), 'utf8');
        const dbConfig = JSON.parse(configRaw).development;

        const conn = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.username,
            password: dbConfig.password,
            database: dbConfig.database
        });

        console.log('🌱 Sincronizando datos de colaboradores con campo email...');

        // Asegurar que la columna email existe
        try {
            await conn.query('ALTER TABLE colaboradores ADD COLUMN email VARCHAR(150) UNIQUE AFTER nombre;');
        } catch (e) {
            // Ya existe
        }

        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query('TRUNCATE TABLE solicitudes');
        await conn.query('TRUNCATE TABLE saldos_vacaciones');
        await conn.query('TRUNCATE TABLE incapacidades');
        await conn.query('TRUNCATE TABLE movimientos_personal');
        await conn.query('TRUNCATE TABLE colaboradores');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        const colaboradoresIds = [];

        for (let i = 0; i < nombres.length; i++) {
            const id = `EMP-${String(i + 1).padStart(3, '0')}`;
            colaboradoresIds.push(id);
            const nombre = nombres[i];
            const email = generarEmail(nombre);
            
            const rol = (i === 0 || nombre.includes("Vargas")) ? 'admin_rrhh' : 'colaborador';
            const dep = (rol === 'admin_rrhh') ? 'Recursos Humanos' : departamentos[i % departamentos.length];
            const pLista = puestos[dep] || ["Especialista"];
            const puesto = (rol === 'admin_rrhh') ? 'Director de Personas & Cultura' : pLista[i % pLista.length];
            
            const diasAtras = 60 + Math.floor(Math.random() * 800);
            const fechaIngreso = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            await conn.query(`
                INSERT INTO colaboradores (id, nombre, email, departamento, puesto, fecha_ingreso, jefe_id, rol, estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [id, nombre, email, dep, puesto, fechaIngreso, i === 0 ? null : 'EMP-001', rol, 'activo']);

            const diasTomados = Math.floor(Math.random() * 12);
            const diasAsignados = (i % 6 === 0) ? 35 : 15;
            const diasDisponibles = diasAsignados - diasTomados;

            await conn.query(`
                INSERT INTO saldos_vacaciones (colaborador_id, periodo, dias_asignados, dias_tomados, dias_disponibles)
                VALUES (?, '2026', ?, ?, ?)
            `, [id, diasAsignados, diasTomados, diasDisponibles]);
        }
        console.log(`✅ ${nombres.length} colaboradores sembrados con emails únicos oficiales.`);

        // Solicitudes
        const tiposSolicitud = ['vacaciones', 'permiso_estudio', 'permiso_personal', 'duelo'];
        const estados = ['aprobada', 'aprobada', 'pendiente', 'rechazada'];

        for (let i = 0; i < 45; i++) {
            const colabId = colaboradoresIds[Math.floor(Math.random() * colaboradoresIds.length)];
            const tipo = tiposSolicitud[Math.floor(Math.random() * tiposSolicitud.length)];
            const estado = (i < 8) ? 'pendiente' : estados[Math.floor(Math.random() * estados.length)];
            const diasAtras = (estado === 'pendiente' && i < 4) ? 4 : Math.floor(Math.random() * 90);
            const fechaIni = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const fechaFin = new Date(Date.now() - (diasAtras - 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const creadaEn = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);

            await conn.query(`
                INSERT INTO solicitudes (id, colaborador_id, tipo, fecha_inicio, fecha_fin, estado, aprobador_id, creada_en)
                VALUES (?, ?, ?, ?, ?, ?, 'EMP-001', ?)
            `, [`SOL-${String(i + 1).padStart(3, '0')}`, colabId, tipo, fechaIni, fechaFin, estado, creadaEn]);
        }

        // Incapacidades
        const entidades = ['Seguro Social (CCSS/IMSS)', 'Instituto Nacional de Seguros', 'Clínica Privada Acreditada'];
        for (let i = 0; i < 12; i++) {
            const colabId = colaboradoresIds[Math.floor(Math.random() * colaboradoresIds.length)];
            const diasAtras = Math.floor(Math.random() * 20);
            const fechaIni = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const duracion = 3 + Math.floor(Math.random() * 7);

            await conn.query(`
                INSERT INTO incapacidades (colaborador_id, tipo, fecha_inicio, dias, entidad)
                VALUES (?, 'Enfermedad común', ?, ?, ?)
            `, [colabId, fechaIni, duracion, entidades[i % entidades.length]]);
        }

        // Movimientos
        const tiposMov = ['ingreso', 'ascenso', 'salida'];
        for (let i = 0; i < 15; i++) {
            const colabId = colaboradoresIds[Math.floor(Math.random() * colaboradoresIds.length)];
            const tipo = tiposMov[i % tiposMov.length];
            const diasAtras = Math.floor(Math.random() * 90);
            const fecha = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            await conn.query(`
                INSERT INTO movimientos_personal (colaborador_id, tipo, fecha, motivo)
                VALUES (?, ?, ?, ?)
            `, [colabId, tipo, fecha, tipo === 'salida' ? 'Oferta externa' : (tipo === 'ascenso' ? 'Promoción por desempeño' : 'Nueva contratación')]);
        }

        await conn.end();
        console.log('🌟 Base de datos actualizada con emails y datos consistentes.');
    } catch (err) {
        console.error('Error poblando MySQL:', err);
    }
}

poblarDatos();
