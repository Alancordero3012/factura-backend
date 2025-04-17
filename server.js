const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🚨 Tu URL de conexión a PostgreSQL
const connectionString = 'postgresql://postgres:OhbCwpJsOGbJnXdlbjMAdYeCJyfHzUKg@maglev.proxy.rlwy.net:54197/railway';


const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

app.post('/guardarFactura', async (req, res) => {
  const {
    id, nombre, correo, telefono,
    descripcion, vendedor, fecha, estado, articulos
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ✅ Mostrar los campos recibidos correctamente
    console.log("Campos recibidos:", Object.keys(req.body));

    // Insertar la factura principal
    await client.query(`
      INSERT INTO facturas (id, nombre, correo, telefono, descripcion, vendedor, fecha, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, nombre, correo, telefono, descripcion, vendedor, new Date(fecha), estado]);

    // Insertar los artículos asociados
    for (const art of articulos) {
      await client.query(`
        INSERT INTO factura_articulos (id_factura, codigo, producto, cantidad)
        VALUES ($1, $2, $3, $4)
      `, [id, art.codigo, art.producto, art.cantidad]);
    }

    await client.query('COMMIT');
    res.status(200).send({ mensaje: 'Factura guardada correctamente' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al guardar factura:', err);
    res.status(500).send({ error: 'Error al guardar factura' });
  } finally {
    client.release();
  }
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
