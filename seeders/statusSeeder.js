const { Status } = require('../models');

const insertStatuses = async () => {
  const statuses = [
    { status: 'present', active: true },
    { status: 'late', active: true },
    { status: 'absent', active: true },
    { status: 'absent_with_permission', active: true },
  ];

  for (const statusObj of statuses) {
    const [statusInstance, created] = await Status.findOrCreate({
      where: { status: statusObj.status },
      defaults: {
        active: statusObj.active,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (created) {
      console.log(`Inserted status: ${statusInstance.status}`);
    } else {
      console.log(`Status already exists: ${statusInstance.status}`);
    }
  }
};

module.exports = insertStatuses;
