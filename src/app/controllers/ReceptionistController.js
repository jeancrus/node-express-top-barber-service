import User from '../models/User';
import File from '../models/File';

class ReceptionistController {
  async index(req, res) {
    const receptionists = await User.findAll({
      where: { receptionist: true },
      attributes: ['id', 'name', 'email', 'avatar_id'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['name', 'path', 'url', 'url_mobile'],
        },
      ],
    });

    return res.json(receptionists);
  }
}

export default new ReceptionistController();
