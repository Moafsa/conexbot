const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('senha123', 10));
