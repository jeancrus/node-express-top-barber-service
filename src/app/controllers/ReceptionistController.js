import {
  parseISO,
  startOfDay,
  endOfDay,
  setSeconds,
  setHours,
  setMinutes,
  format,
  isBefore,
  startOfHour,
  isValid,
  subHours,
} from 'date-fns';
import { Op } from 'sequelize';
import { ptBR } from 'date-fns/locale';
import * as Yup from 'yup';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';
import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class ReceptionistController {
  async index(req, res) {
    const isAdmin = await User.findOne({
      where: {
        id: req.userId,
        admin: true,
      },
    });
    const isReceptionist = await User.findOne({
      where: {
        id: req.userId,
        receptionist: true,
      },
    });
    if (!(isAdmin || isReceptionist)) {
      return res
        .status(401)
        .json({ error: 'Usuário não tem permissão para acesso' });
    }

    const allProviders = await User.findAll({
      where: {
        provider: true,
      },
    });

    const users = await User.findAll({
      where: {
        provider: false,
      },
    });

    const { date } = req.query;

    const parsedDate = parseISO(date);

    const appointments = await Appointment.findAll({
      where: {
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
      order: ['date'],
    });

    const schedule = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
    ];

    const available = schedule.map((time) => {
      const [hour, minute] = time.split(':');
      const value = setSeconds(
        setMinutes(setHours(parsedDate, hour), minute),
        0
      );

      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        usersAvailable: users.filter(
          (user) =>
            !appointments.find(
              (appoints) =>
                format(appoints.date, 'HH:mm') === time &&
                user.id === appoints.user_id
            )
        ),
        providersAvailable: allProviders.filter(
          (provid) =>
            !appointments.find(
              (appoints) =>
                format(appoints.date, 'HH:mm') === time &&
                provid.id === appoints.provider_id
            )
        ),
      };
    });

    return res.json(available);
  }

  async show(req, res) {
    const isAdmin = await User.findOne({
      where: {
        id: req.userId,
        admin: true,
      },
    });
    const isReceptionist = await User.findOne({
      where: {
        id: req.userId,
        receptionist: true,
      },
    });
    if (!(isAdmin || isReceptionist)) {
      return res
        .status(401)
        .json({ error: 'Usuário não tem permissão para acesso' });
    }

    const parsedDate =
      req.params.date === 'all' ? 'all' : parseISO(req.params.date);
    let appointments;
    if (!(parsedDate === 'all')) {
      appointments = await Appointment.findAll({
        where: {
          canceled_at: null,
          date: parsedDate,
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name'],
          },
        ],
        order: ['date'],
      });
    } else {
      appointments = await Appointment.findAll({
        where: {
          canceled_at: null,
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name'],
          },
          {
            model: User,
            as: 'provider',
            attributes: ['name'],
          },
        ],
        order: ['date'],
      });
    }

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      user_id: Yup.number().required(),
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    const { user_id, provider_id, date } = req.body;

    /**
     * Check if provider_id is a provider
     */

    if (user_id === provider_id) {
      return res
        .status(401)
        .json({ error: 'Cliente não poder prestar serviço para ele mesmo!' });
    }

    const isProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true,
      },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'Você pode somente marcar com barbeiros!' });
    }

    /**
     * Check for past dates
     */
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res
        .status(400)
        .json({ error: 'Datas no passado não são permitidas' });
    }

    /**
     * Check date availability
     */

    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id,
      provider_id,
      date: hourStart,
    });

    /**
     * Notify appointment provider
     */

    const user = await User.findByPk(user_id);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: ptBR }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    const isAdmin = await User.findOne({
      where: {
        id: req.userId,
        admin: true,
      },
    });
    const isReceptionist = await User.findOne({
      where: {
        id: req.userId,
        receptionist: true,
      },
    });
    if (!(isAdmin || isReceptionist)) {
      return res
        .status(401)
        .json({ error: 'Usuário não tem permissão para acesso.' });
    }

    if (isValid(appointment.canceled_at)) {
      return res.status(401).json({ error: 'Agendamento já está cancelado.' });
    }

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'Você pode cancelar somente com duas horas de antecedência.',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await Queue.add(CancellationMail.key, {
      appointment,
    });

    return res.json(appointment);
  }
}

export default new ReceptionistController();
