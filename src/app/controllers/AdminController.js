import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';

class AdminController {
  async index(req, res) {
    try {
      // const { page = 1 } = req.query;
      const user = await User.findByPk(req.userId);
      if (!(user.admin || user.receptionist))
        return res.status(400).json({
          error:
            'Somente usuários do tipo administrador ou recepcionistra podem ver a listagem!',
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
        // limit: 20,
        // offset: (page - 1) * 20,
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['name', 'path', 'url', 'url_mobile'],
          },
        ],
      });

      return res.json(allUsers);
    } catch (error) {
      return res.status(500).json({
        error,
      });
    }
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
            'Uusuário do tipo administrador, recepcionista ou barbeiro não podem ser criados sem permissão.',
        });
    }

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha de validação' });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(400).json({ error: 'Usuário já existe.' });
    }

    const { id, name, email } = await User.create(req.body);

    return res.json({ id, name, email });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      password: Yup.string().min(6),
      provider: Yup.boolean(),
      admin: Yup.boolean(),
      receptionist: Yup.boolean(),
    });

    const isAdmin = await User.findByPk(req.userId);

    if (!isAdmin.admin)
      return res.status(400).json({
        error: 'Somente administrador pode alterar dados de outros usuários!',
      });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha na validação.' });
    }

    const { email } = req.body;

    const user = await User.findByPk(req.params.id);

    if (isAdmin.id === user.id)
      return res
        .status(400)
        .json({ error: 'Não pode alterar o próprio usuário!' });

    if (!user) {
      return res.status(400).json({ error: 'Usuário não existe!' });
    }

    if (email !== user.email) {
      const userExists = await User.findOne({
        where: { email },
      });

      if (userExists) {
        return res.status(400).json({ error: 'Usuário já existe!' });
      }
    }

    await user.update(req.body);

    const { name, avatar } = await User.findByPk(req.params.id, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url', 'url_mobile'],
        },
      ],
    });

    return res.json({ id: req.params.id, name, email, avatar });
  }

  async delete(req, res) {
    try {
      const isAdmin = await User.findByPk(req.userId);

      if (!isAdmin.admin)
        return res.status(400).json({
          error: 'Somente perfil de administrador para deletar usuários!',
        });
      if (isAdmin.id === Number(req.params.id, 10))
        return res
          .status(400)
          .json({ error: 'Você não pode deletar seu próprio usuário.' });
      const userExist = await User.findByPk(Number(req.params.id, 10));

      if (!userExist)
        return res.status(400).json({ error: 'Usuário não existe.' });

      await User.destroy({
        where: {
          id: userExist.id,
        },
      });

      return res.json(`Usuário ${userExist.name} deletado com sucesso!`);
    } catch (error) {
      return res.status(401).json({ error: 'Ops...erro ao deletar!' });
    }
  }

  async show(req, res) {
    try {
      const user = await User.findByPk(req.userId);

      if (!(user.receptionist || user.admin))
        return res.status(401).json({
          error: 'Necessário usuário do tipo adminstrador ou recepcionista.',
        });

      const userExist = await User.findByPk(Number(req.params.id, 10));

      if (!userExist)
        return res.status(400).json({ error: 'User não existe.' });

      const { id, name, email, provider, admin, receptionist } = userExist;
      return res.json({ id, name, email, provider, admin, receptionist });
    } catch (error) {
      return res.status(401).json({ error: 'Error on show!' });
    }
  }
}

export default new AdminController();
