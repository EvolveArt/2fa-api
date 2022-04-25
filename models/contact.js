const mongoose = require('mongoose');

const Contact = mongoose.Schema(
  {
    email: {
			type: String,
			required: true,
			index: {
				unique: true,
			},
		}
  }
);

//*** --- function for response JSON for record list request
Contact.methods.toJSON = function () {
  return {
    email: this.email
  };
};

mongoose.model('Contact', Contact);
