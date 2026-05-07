import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AiController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // 1. Configuramos el módulo de pruebas
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 2. Aplicamos el ValidationPipe global para que se comporte como Producción
    app.useGlobalPipes(new ValidationPipe());

    // 3. Inicializamos la app
    await app.init();
  });

  // 4. Test "Happy Path": Generar Embeddings exitosamente
  it('/ai/embed (POST) - Debe retornar 201 y un vector', () => {
    return request(app.getHttpServer())
      .post('/ai/embed') // ¿Qué método HTTP usamos?
      .send({ text: 'Necesito una herramienta para organizar mis tareas' })
      .expect(201) // ¿Qué status code HTTP esperamos para una creación exitosa?
      .expect((res) => {
        expect(res.body.message).toEqual('Embedding generado con éxito');
        expect(res.body.vector).toBeDefined();
        // Comprobamos que el vector sea un arreglo verdadero
        expect(Array.isArray(res.body.vector)).toBe(true);
      });
  });

  afterAll(async () => {
    // 5. Limpiamos la casa cerrando la app
    await app.close();
  });
});
