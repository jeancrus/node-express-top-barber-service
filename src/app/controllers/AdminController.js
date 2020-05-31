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
}

export default new AdminController();
