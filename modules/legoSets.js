const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Add this line to bypass self-signed certificate errors
    },
  },
});

const Theme = sequelize.define('Theme', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
});

const Set = sequelize.define('Set', {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
  },
  year: {
    type: Sequelize.INTEGER,
  },
  num_parts: {
    type: Sequelize.INTEGER,
  },
  theme_id: {
    type: Sequelize.INTEGER,
  },
  img_url: {
    type: Sequelize.STRING,
  },
});

Set.belongsTo(Theme, { foreignKey: 'theme_id', as: 'theme' });

async function initialize() {
  try {
    // Synchronize the database and create tables based on the models
    await sequelize.sync();
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
}

async function getAllSets() {
  try {
    // Fetch all sets with associated themes from the database
    const allSets = await Set.findAll({
      include: [{ model: Theme, attributes: ['name'], as: 'theme' }],
    });

    return allSets;
  } catch (error) {
    console.error('Error fetching all sets:', error);
    throw error;
  }
}

async function getSetByNum(setNum) {
  try {
    // Fetch a set by set number with associated theme from the database
    const foundSet = await Set.findOne({
      where: { set_num: setNum },
      include: [{ model: Theme, attributes: ['name'], as: 'theme' }],
    });

    if (foundSet) {
      return foundSet;
    } else {
      throw new Error('Unable to find the requested set.');
    }
  } catch (error) {
    console.error('Error fetching set by set number:', error);
    throw error;
  }
}
async function getSetsByTheme(theme) {
  try {
    // Fetch sets by theme from the database
    const foundSets = await Set.findAll({
      include: [
        {
          model: Theme,
          attributes: ['name'],
          as: 'theme',
          where: sequelize.where(
            sequelize.fn('UPPER', sequelize.col('theme.name')),
            'LIKE',
            `%${theme.toUpperCase()}%`
          ),
        },
      ],
    });

    if (foundSets.length > 0) {
      return foundSets;
    } else {
      throw new Error('Unable to find requested sets.');
    }
  } catch (error) {
    console.error('Error fetching sets by theme:', error);
    throw error;
  }
}
//After navbar partial
// Function to add a new set to the database
async function addSet(setData) {
  try {
    await Set.create(setData);
  } catch (err) {
    throw err;
  }
}
// Function to get all themes from the database
async function getAllThemes() {
  try {
    const themes = await Theme.findAll();
    return themes;  
  } catch (err) {
    throw err;
  }
}
//To edit sets
function editSet(set_num, setData) {
  return Set.update(setData, { where: { set_num } });
}
//To delete sets
// function deleteSet(set_num) {
//   return new Promise((resolve, reject) => {
//     Set.destroy({ where: { set_num: set_num } })
//       .then(() => resolve())
//       .catch((err) => reject(err));
//   });
// }f
function deleteSet(set_num) {
  return new Promise((resolve, reject) => {
    Set.destroy({ where: { set_num: set_num } })
      .then(() => resolve())
      .catch((err) => {
        console.error('Error deleting set:', err);
        reject(err);
      });
  });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet };