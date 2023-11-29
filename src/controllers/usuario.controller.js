const { Pool } = require('pg');
const { config } = require('dotenv');
const Crypto = require('crypto');
const bcrypt = require('bcrypt');

config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});


function createRandomString(){
    return Crypto.randomBytes(50).toString('base64').slice(0,50);
}

const createSession = async (req,res) => {
    const { codigo, password } = req.body;

    const query ='SELECT password FROM usuario WHERE codigo = $1';

    const passdb = await pool.query(query,[codigo]).then( response => {
        if(response.rowCount == 0){
            res.status(406).json(`Usuario no registrado`);
            return null;
        }
        
        console.log(response.rows);
        return response.rows[0].password;
    }).catch(err => {
        res.status(501).json(err);
        return null;
    });

    if(passdb == null)
        return;

    const isEqual = await bcrypt.compare(password,passdb);

    if(!isEqual){
        res.status(401).json(`Datos invalidos`);
        return
    }


    const session_id = createRandomString();
    console.log(`session_id ${session_id}`);

    const query_set_session = 'UPDATE usuario SET session = $1 WHERE codigo = $2';
    await pool.query(query_set_session,[session_id,codigo]).then( response => {
        res.status(200).json(session_id);
    }).catch( err => {
        res.status(501).json(`Error`);
    });

}


const verifySession = async (req,res) =>{
    const { session} = req.body;

    await pool.query('SELECT codigo,nombre FROM usuario WHERE session = $1',[session]).then( response => {
        if(response.rowCount <= 0){
            res.status(401).json(`invalid`);
            return
        }

        res.status(200).json(response.rows);
    }).catch( err => {
        console.log(err);
        res.status(401).json(`fail`);
    });
}

const createEstudiante = async (req,res) => {
    const { codigo, nombre, password, estado, ciclo, carrera } = req.body;

    const session_id = createRandomString();

    const query_usuario = "INSERT INTO usuario (codigo,nombre,password,session) VALUES \
    ($1,$2,$3,$4) RETURNING codigo";

    const query_estudiante = "INSERT INTO estudiante(codigo,carrera,ciclo,estado) VALUES \
    ($1,$2,$3,$4)";

    const hash = await bcrypt.hash(password,5);

    const id = await pool.query(query_usuario,[codigo,nombre,hash,session_id]).then( response => {
        return response.rows[0].codigo;
    }).catch( err => {
        console.log(err);
        return null;
    });


    if(id == null){
        res.status(501).json('Error al crear usuario');
        return;
    }


    await pool.query(query_estudiante,[codigo,carrera,ciclo,estado]).then( response => {
        res.status(200).json(session_id);
    }).catch( err => {
        console.log(err);
        res.status(501).json('Error al crear estudiante');
    });
}

const updatePasswordFormat = async (req,res) => {
    const query_request = "SELECT codigo, password FROM usuario";
    const query_update  = "UPDATE usuario SET password = $1 WHERE codigo = $2";


    const users = await pool.query(query_request).then( response => {
        return response.rows;
    }).catch( err => {
        console.log(err);
        res.status(501).json('Error');
        return null;
    });


    if(users == null) return;


    users.forEach(async element => {
        const hash = await bcrypt.hash(element.password,5);
        pool.query(query_update,[hash,element.codigo]);
    });

    res.status(200).json('ABC');

}

module.exports = {
    verifySession,
    createSession,
    createEstudiante,
    updatePasswordFormat
}