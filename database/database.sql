CREATE DATABASE recomendacionescucei;

CREATE TABLE usuario(
    codigo VARCHAR(9) NOT NULL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    password VARCHAR(50) NOT NULL,
    session VARCHAR(50)
);

CREATE TABLE estudiante(
    codigo  VARCHAR(9) NOT NULL REFERENCES usuario(codigo),
    carrera VARCHAR(60),
    ciclo   VARCHAR(5),
    estado  VARCHAR(25)
);

CREATE TABLE administrador(
    codigo VARCHAR(9) NOT NULL REFERENCES usuario(codigo)
);

CREATE TABLE docente(
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL
);

CREATE TABLE materia(
    clave VARCHAR(20) NOT NULL PRIMARY KEY,
    departamento VARCHAR(150),
    nombre VARCHAR(50)
);

CREATE TABLE docente_materia(
    docente_id INTEGER NOT NULL REFERENCES docente(id),
    materia_id VARCHAR(20) NOT NULL REFERENCES materia(clave)
);

CREATE TABLE review(
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docente(id),
    materia_id VARCHAR(20) REFERENCES materia(clave),
    calificacion INTEGER,
    estudiante_codigo VARCHAR(9) REFERENCES usuario(codigo),
    comentario VARCHAR(400),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE report(
    review_id INTEGER NOT NULL REFERENCES review(id)
);

DROP TABLE review;
DROP TABLE docente_materia;
DROP TABLE materia;

INSERT INTO usuario (codigo,nombre,password) VALUES
    ('217555871','Gomez Alvarez Edmundo','password');

INSERT INTO estudiante(codigo,carrera,ciclo) VALUES
    ('217555871','Ingenieria en computacion','2020B');

SELECT d_m.docente_id as docente FROM docente_materia as d_m
    JOIN docente as d on d.id = d_m.docente_id
    JOIN materia as m on m.clave = d_m.materia_id
    WHERE d_m.docente_id = 3 AND d_m.materia_id = 'I5884';

SELECT  m.nombre as materia, d.nombre as docente, r.calificacion as calificacion, r.comentario as comentario FROM review as r
    JOIN docente as d on r.docente_id = d.id
    JOIN materia as m on r.materia_id = m.clave
    WHERE d.id = (SELECT id FROM docente WHERE nombre = 'GARCIA HERNANDEZ, MARTIN');

INSERT INTO review(materia_id,docente_id,calificacion,estudiante_codigo,comentario) VALUES
    ();

SELECT u.nombre AS nombre, u.codigo AS codigo, e.carrera AS carrera, e.ciclo AS ciclo, e.estado AS estado FROM usuario as u
    JOIN estudiante AS e on u.codigo = e.codigo
    WHERE u.codigo = '217555871';

SELECT d.nombre as docente, m.nombre as materia, r.calificacion as calificacion,
    r.comentario as comentario FROM review as r 
    JOIN docente as d ON d.id = r.docente_id
    JOIN materia as m ON m.clave = r.materia_id
    WHERE r.estudiante_codigo = '217555871';
    

SELECT nombre FROM docente WHERE LOWER(nombre) LIKE LOWER('%er%') ORDER BY nombre;