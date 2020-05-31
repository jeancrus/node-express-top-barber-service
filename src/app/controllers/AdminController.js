import User from '../models/User';
import File from '../models/File';

class AdminController {
  async index(req, res) {
    try {
      const user = await User.findByPk(req.userId);
      const admins = await User.findAll({
        where: { admin: true },
        attributes: ['id', 'name', 'email', 'avatar_id'],
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['name', 'path', 'url', 'url_mobile'],
          },
        ],
      });

      return res.json(admins);
    } catch (error) {}
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6),
    });

    const user = await User.findByPk(req.userId);
    console.log('AdminController -> store -> user', user);

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
