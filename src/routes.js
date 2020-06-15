import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';
import UserController from './app/controllers/UserController';
import ProviderController from './app/controllers/ProviderController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import AppointmentController from './app/controllers/AppointmentController';

import authMiddleware from './app/middlewares/auth';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';
import AvailableController from './app/controllers/AvailableController';
import AdminController from './app/controllers/AdminController';
import ReceptionistController from './app/controllers/ReceptionistController';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);

routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);

routes.get('/providers', ProviderController.index);

routes.get('/providers/:providerId/available', AvailableController.index);

routes.get('/appointments', AppointmentController.index);

routes.post('/appointments', AppointmentController.store);

routes.delete('/appointments/:id', AppointmentController.delete);

routes.get('/schedule', ScheduleController.index);

routes.get('/notifications', NotificationController.index);

routes.put('/notifications/:id', NotificationController.update);

routes.post('/files', upload.single('file'), FileController.store);

routes.get('/admins', AdminController.index);

routes.post('/admin', AdminController.store);

routes.put('/admin/:id', AdminController.update);

routes.delete('/admin/:id', AdminController.delete);

routes.get('/admin/:id', AdminController.show);

routes.get('/receptionist/schedules', ReceptionistController.index);

routes.post('/receptionist/schedules', ReceptionistController.store);

routes.get('/receptionist/schedules/:date', ReceptionistController.show);

routes.delete('/receptionist/schedules/:id', ReceptionistController.delete);

export default routes;
