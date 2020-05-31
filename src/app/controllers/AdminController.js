import User from '../models/User';
import File from '../models/File';
import * as Yup from 'yup';

class AdminController {
  async index(req, res) {
    try {
      const { page = 1 } = req.query;
      const user = await User.findByPk(req.userId);
      if (!(user.admin || user.receptionist))
        return res.status(400).json({
          error: 'Only admin or receptionist user can see all the users!',
        });
      const allUsers = await User.findAll({
        attributes: [
          'id',
          'name',
          'email',
          'avatar_id',
          'provider',
          'admin',
          'receptionist',
        ],
        order: ['id'],
        limit: 20,
        offset: (page - 1) * 20,
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['name', 'path', 'url', 'url_mobile'],
          },
        ],
      });

      return res.json(allUsers);
    } catch (error) {}
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6),
    });

    const user = await User.findByPk(req.userId);

    if (req.body.admin || req.body.provider || req.body.receptionist) {
      if (!user.admin)
        return res.status(400).json({
          error:
            'User admin, provider or receptionist cannot be created without admin user previlege.',
        });
    }

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const { id, name, email } = await User.create(req.body);

    return res.json({ id, name, email });
  }
}

export default new AdminController();
