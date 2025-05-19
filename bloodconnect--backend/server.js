const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://bezzavarapupaulbabu:bloodconnect@cluster0.p9t2nz1.mongodb.net/userdata', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

var db = mongoose.connection;
db.on('error', (err) => console.log('Error in connection to database:', err));
db.once('open', () => console.log('Connected to database'));

var userSchema = new mongoose.Schema({
    username: String,
    email: String,
    mobilenumber: String,
    password: String,
    bloodgroup: String,
    address: String
});

var User = mongoose.model('User', userSchema);

app.use(express.static(path.join(__dirname, 'client/build')));
app.post('/login', async (req, res) => {
    const { mobilenumber, password } = req.body;

    try {
        const user = await User.findOne({ mobilenumber, password });
        if (user) {
            res.status(200).send({ message: "Login successful", user });
        } else {
            res.status(401).send({ message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send({ message: "An error occurred during login" });
    }
});
app.post('/signup', async (req, res) => {
    const { username, email, mobilenumber, password, bloodgroup, address } = req.body;

    try {
        const existingUser = await User.findOne({ mobilenumber });
        if (existingUser) {
            return res.status(409).send({ message: "Mobile number already registered" });
        }
        const newUser = new User({ username, email, mobilenumber, password, bloodgroup, address });
        await newUser.save();

        res.status(201).send({ message: "Signup successful", user: newUser });
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send({ message: "An error occurred during signup" });
    }
});

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'team5bloodconnect@gmail.com',
        pass: 'vgnx kovh sjsg hzma',
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Route to handle contact form submission
app.post('/contactus', (req, res) => {
    const { name, email, issue, rating } = req.body;

    const mailOptions = {
        from: email,
        to: 'team5bloodconnect@gmail.com',
        subject: `New Contact Form Submission from ${name}`,
        text: `
            Name: ${name}
            Email: ${email}
            Issue: ${issue}
            Rating: ${rating}
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error occurred:', error);
            return res.status(500).send({ message: 'Error sending email: ' + error });
        }
        console.log('Email sent:', info.response);
        res.status(200).send({ message: 'Email sent: ' + info.response });
    });
});
// Route to search for eligible donors based on blood group
app.post('/search-donors', async (req, res) => {
    const { patientName, hospitalName, contactNumber, bloodGroup } = req.body;
  
    try {
      // Fetch eligible donors based on the requested blood group
      const donors = await User.find({ bloodgroup: bloodGroup });
    //   console.log("Fetched donors:", donors);
      console.log(donors.length);
      if (donors&& donors.length) {
        // Send email to each eligible donor
        donors.forEach(donor => {
            const mailOptions = {
                from: 'team5bloodconnect@gmail.com',
                to: donor.email,  // Donor's email address
                subject: `Urgent Blood Request: ${bloodGroup} Needed`,
                text: `
                Dear ${donor.username},

                There is an urgent request for blood of blood group ${bloodGroup}.

                Patient Name: ${patientName}
                Hospital Name: ${hospitalName}
                Contact Number: ${contactNumber}

                Please contact the hospital or the patient immediately to offer your help.

                Thank you for your generosity.

                Regards,
                BloodConnect Team
                `
            };
            
            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Email sent:', info.response);
                }
            });
        });

        res.status(200).json({ message: 'Email sent to eligible donors' });
      } else {
        res.status(404).json({ message: 'No eligible donors found' });
      }
    } catch (error) {
      console.error('Error fetching donors:', error);
      res.status(500).json({ message: 'An error occurred while searching for donors' });
    }
});
  

app.listen(8080, () => {
    console.log('Listening on port 8080');
});
