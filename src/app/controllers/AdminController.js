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

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    const isAdmin = await User.findByPk(req.userId);

    if (!isAdmin.admin)
      return res.status(400).json({
        error: 'Only admin can change other users data!',
      });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { email, oldPassword, id } = req.body;

    const user = await User.findByPk(id);

    if (email !== user.email) {
      const userExists = await User.findOne({
        where: { email },
      });

      if (userExists) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    await user.update(req.body);

    const { name, avatar } = await User.findByPk(id, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url', 'url_mobile'],
        },
      ],
    });

    return res.json({ id, name, email, avatar });
  }

  async delete(req, res) {
    try {
      const isAdmin = await User.findByPk(req.userId);

      if (!isAdmin.admin)
        return res
          .status(400)
          .json({ error: 'Must be a admin to delete a user' });
      if (isAdmin.id === Number(req.params.id, 10))
        return res
          .status(400)
          .json({ error: 'You cant delete your own user.' });
      const userExist = await User.findByPk(Number(req.params.id, 10));

      if (!userExist)
        return res.status(400).json({ error: 'User doesnt exists.' });

      await User.destroy({
        where: {
          id: userExist.id,
        },
      });

      return res.json(`User ${userExist.name} deleted sucessfully!`);
    } catch (error) {
      return res.status(401).json({ error: 'Error on delete!' });
    }
  }

  async show(req, res) {
    try {
      const user = await User.findByPk(req.userId);

      if (!(user.receptionist || user.admin))
        return res.status(401).json({
          error: 'User must be admin or receptionist to see the listed user',
        });

      const userExist = await User.findByPk(Number(req.params.id, 10));

      if (!userExist)
        return res.status(400).json({ error: 'User doesnt exists.' });

      const { id, name, email } = userExist;
      return res.json({ id, name, email });
    } catch (error) {
      return res.status(401).json({ error: 'Error on show!' });
    }
  }
}

export default new AdminController();
