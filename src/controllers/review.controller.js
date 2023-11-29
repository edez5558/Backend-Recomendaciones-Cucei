const { Pool } = require('pg');
const { config } = require('dotenv')
const axios = require('axios');
const cheerio = require('cheerio');
const { response } = require('express');

config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});


async function existMateria(clave){
    const response = await pool.query('SELECT * FROM materia WHERE clave = $1',[clave]) 

    return response.rowCount > 0
}

async function existDocente(nombre){
    return await pool.query('SELECT * from docente WHERE nombre = $1',[nombre]).then(res => {
        if(res.rowCount <= 0) return -1;
    
        return res.rows[0].id;
    }).catch( err => {
        console.log(err);
        return -1;
    });
}

async function searchMateria(clave){
    const url = 'http://consulta.siiau.udg.mx/wco/scpcata.detmate';


    const clavep = `INTE,${clave},202220`;
    const params = {
        params: {
            subclavep : clavep,
            pEntra : "OAP"
        }
    }

    return await axios.get(url,params).then( (response) => {
        const $ = cheerio.load(response.data);
        const materia_name = $('body > form > table > tbody > tr:nth-child(1) > th').text();
        const departamentos = $('body > form > table > tbody > tr:nth-child(7) > td').text();

        const index = departamentos.indexOf("(CUCEI)");

        let departamento = null;

        if(index != -1){
            const tempString = departamentos.substring(0,index);
            const tempList = tempString.split('\n');
            departamento = tempList[tempList.length - 1];
        }

        console.log(materia_name,departamento);

        return { materia_name, departamento};
    }).catch(err => {
        const a = null;
        return { a, a};
    });
}

async function createMateria(clave){
    const { materia_name, departamento} = await searchMateria(clave);

    console.log(clave,materia_name,departamento);

    if(materia_name == null || departamento == null){
        console.log("No se encontro la materia");
        return false;
    }

    return await pool.query('INSERT INTO materia(clave,nombre,departamento) VALUES ($1,$2,$3)',
        [clave,materia_name,departamento]).then( res => {
            console.log("Materia creada");
            return true;
        }).catch( err => {
            console.log(err);
            return false;
        }
        );
}

async function createDocente(nombre){
    return await pool.query('INSERT INTO docente(nombre) VALUES ($1) RETURNING id',
        [nombre]).then( res => {
            if(res.rowCount <= 0) return -1;

            console.log(res.rows[0].id);
            return res.rows[0].id;
        }).catch( err => {
            console.log(err);
            return -1;
        }
        );
}

async function docenteHasMateria(clave,id){
    const query = 'SELECT d_m.docente_id as docente FROM docente_materia as d_m \
    JOIN docente as d on d.id = d_m.docente_id \
    JOIN materia as m on m.clave = d_m.materia_id \
    WHERE d_m.docente_id = $1 AND d_m.materia_id = $2;'

    return await pool.query(query,[id,clave]).then(res => {
        return res.rowCount > 0;
    }).catch( err => {
        console.log(err);
        return false;
    })
}

async function docenteAddMateria(clave,id){
    const query = 'INSERT INTO docente_materia(materia_id,docente_id) VALUES ($1,$2)';

    return await pool.query(query,[clave,id]).then( res => {
        console.log("Se ha agregado la materia al docente");
        return true;
    }).catch( err => {
        console.log(err);
        return false;
    })
}


const createReview = async (req,res) => {
    let { clave , nombre, calificacion, session, comentario } = req.body;

    clave = clave.toUpperCase() || null;

    const codigo = await pool.query('SELECT codigo FROM usuario WHERE session = $1',[session]).then( response => {
        if(response.rowCount <= 0){
            return '';
        }

        return response.rows[0].codigo;
    }).catch( err => {
        console.log(err);
        return '';
    });

    console.log(clave);
    let isMateriaAvailable = await existMateria(clave);
    if(clave != null && !isMateriaAvailable){
        isMateriaAvailable = await createMateria(clave);
    }

    let docente_id = await existDocente(nombre);
    if(nombre != null && docente_id == -1){
        console.log("creando docente");
        docente_id = await createDocente(nombre);
    }

    if(docente_id == -1){
        res.send('Review no se pudo crear');
    }

    if(isMateriaAvailable && docente_id != -1 && !await docenteHasMateria(clave,docente_id)){
        docenteAddMateria(clave,docente_id);
    }


    const query = 'INSERT INTO review(materia_id,docente_id,calificacion,estudiante_codigo,comentario) VALUES \
                    ($1,$2,$3,$4,$5)';

    const query_without = 'INSERT INTO review(docente_id,calificacion,estudiante_codigo,comentario) VALUES \
                    ($1,$2,$3,$4)';

    const element_query = [clave,docente_id,calificacion,codigo,comentario];
    const element_query_without = [docente_id,calificacion,codigo,comentario];

    const final_query = (isMateriaAvailable && query) || query_without;
    const final_element = (isMateriaAvailable && element_query) || element_query_without;
    
    await pool.query(final_query,final_element).then( response => {
        res.status(200).json(`Review creada correctamente`);
    }).catch( err => {
        console.log(err);
        res.status(501).json('Error al crear la review');
    });
}

const getReviewsByDocenteName = async (nombre) => {
    const query = 'SELECT  r.id as id, m.nombre as materia, d.nombre as docente, r.calificacion as calificacion, r.comentario as comentario FROM review as r \
    LEFT JOIN docente as d on r.docente_id = d.id \
    LEFT JOIN materia as m on r.materia_id = m.clave \
    WHERE d.id = (SELECT id FROM docente WHERE nombre = $1) AND r.escondido = false';

    return await pool.query(query,[nombre]).then( response => {
        return response.rows;
    }).catch(err=>{
        console.log(err);
        return [];
    });
}

const deleteReviews =  async (req,res) => {
    const id = req.body.id;

    const query = "UPDATE review set escondido = true WHERE id = $1"

    pool.query(query,[id]).then( response => {
    }).catch( err => {
        console.log(err);
    });

    res.status(200).json('Shadow delete');
    cancelReport(id);
}

const getDocenteWithReview = async (req,res) => {
    const nombre = req.query.nombre;

    const nombre_like = `%${nombre}%`;

    const query = 'SELECT nombre FROM docente WHERE LOWER(nombre) LIKE LOWER($1) ORDER BY nombre';

    const array = await pool.query(query,[nombre_like]).then(response => {
        return response.rows;
    }).catch( err => {
        console.log(err);
        return [];
    });

    res.status(200).json(array);
}

const reportReview = async (req,res) => {
    const { id } = req.body;

    console.log(id);

    const query = 'INSERT INTO report (review_id) VALUES ($1)';

    pool.query(query,[id]).then( response => {
        console.log(response.rows); 
    }).catch( err => {
        console.log(err);
    });

    res.status(200).json('Reporte hecho');
}

const cancelReport = async (id) => {
    const query = 'DELETE FROM report WHERE review_id = $1';

    console.log(`report cancel ${id}`);

    pool.query(query,[id]).then( response => {
    }).catch( err => {
        console.log(err);
    });
}

const setCancelReport = async (req,res) => {
    const { id } = req.body;

    cancelReport(id);

    res.status(200).json('remover report');
}

const getReports = async () => {
    const query = 'SELECT  r.id as id, m.nombre as materia, d.nombre as docente, r.calificacion as calificacion, r.comentario as comentario FROM review as r \
    LEFT JOIN docente as d on r.docente_id = d.id \
    LEFT JOIN materia as m on r.materia_id = m.clave \
    WHERE r.id IN (SELECT review_id as id FROM report) AND r.escondido = false ';

    return await pool.query(query).then(response => {
        return response.rows;
    }).catch( err => {
        console.log(err);
        res.status(501).json([]);
    });
}

module.exports = {
    getReviewsByDocenteName,
    createReview,
    getDocenteWithReview,
    deleteReviews,
    reportReview,
    setCancelReport,
    getReports
}