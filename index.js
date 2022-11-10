/* VARIABLES DE CONFIGURACION */
//! usar mysql2 
const mysql2 = {
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '102030',
        database: 'coder_desafio_7'
    },
    pool: { min: 0, max: 7 },
};

//! usar sqlite3 
const sqlite3 = {
    client: 'sqlite3',
    connection: { filename: './db/mydb.sqlite' }
};

/* *********************** */

/* const productos = require('./router/productosRouter'); */
/* const { Server: SocketServer } = require('socket.io'); */
/* const path = require('path'); */
/* const { Server: HttpServer } = require('http'); */
//const ProductosControllerJSON = require('./controller/ProductosController');
//const arrProductos = require('./model/arrProductos.json');
/* const {createTable, selectData, insertData} = require('./controller/DbController'); */
/* const apitestrouter = require('./router/apiTestRouter'); */
import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import {fileURLToPath} from 'url';
import productos from './router/productosRouter.js';
import apitestrouter from './router/apiTestRouter.js';
import { createTable, selectData, insertData } from './controller/DbController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 8080;
const app = express();
/* app.use(express.static(__dirname + '/public')); */
const httpServer = new HttpServer(app);

httpServer.listen(port, () => console.log(`Server running on port ${port}`));

const oi = new SocketServer(httpServer);

//! view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', express.static(path.join(__dirname, 'public'))); //! aca se declaran los archivos estaticos

//! routes
app.use('/', productos);
app.use('/', apitestrouter);


let id = 0;
const messages = [];
//const productosController = new ProductosControllerJSON(arrProductos);

/* ********************************************************************************** */
/* ****************************** CREACION DE LA TABLA ******************************* */

try {
    createTable(mysql2 , 'productos', (table) => {
        table.increments('id').primary();
        table.string('nombre', 50).notNullable();
        table.float('precio').notNullable();
        table.string('miniatura').notNullable();
    });

    createTable(sqlite3 ,'chat', (table) => {
        table.increments('id').primary();
        table.string('email', 50).notNullable();
        table.string('hora').notNullable();
        table.string('msj').notNullable();
    });
} catch (error) {
    console.log(error.message);
}

/* ********************************************************************************** */
/* ********************************************************************************** */

const datos = {
    title: 'Coder House Web Sockets',
};

//! on = escuchar
//! emit = emitir
oi.on('connection', async (socket) => {
    /* Evento de conexion */
    //console.log('Nuevo cliente conectado!', socket.id);

    selectData( mysql2 , 'productos').then((data) => {
        socket.emit('datos', {
            ...datos,
            productos: data,
        });
    });

    selectData( sqlite3 , 'chat').then((data) => {
        socket.emit('messages', data);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado', socket.id);
    });

    socket.on('producto_creado', (data) => {
        console.log('Datos recibidos del cliente', data);

        insertData(mysql2 ,'productos', data)
            .then(() => { selectData(mysql2,'productos')
            .then((data) => {oi.sockets.emit('datos', {...datos, productos: data })})
        });
        ;
    });

    socket.on('msj', (data) => {
        console.log('Datos recibidos del cliente', data);
        //hora  DD/MM/YYYY HH:MM:SS sin am/pm
       /*  messages.push({ ...data, hora: new Date().toLocaleString('es-AR') });
        oi.sockets.emit('messages', messages);
        console.log('Datos enviados al cliente', messages); */

        insertData(sqlite3 ,'chat', { ...data, hora: new Date().toLocaleString('es-AR') }).then(() => {
            selectData(sqlite3,'chat').then((data) => {
                oi.sockets.emit('messages', data);
            })
        });

    });
});
