const User = require("../models/user");
const { hashPassword, comparePassword } = require("../helpers/authHelpers");
const jwt = require("jsonwebtoken");

const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if (!user) {
            return res.status(401).json({
                message: "No user found"
            });
        }
        const match = await comparePassword(password, user.password);
        if (match) {
            const token = jwt.sign(
                {
                    email: user.email, 
                    id: user._id, 
                    firstName: user.firstName, 
                    lastName: user.lastName
                }, 
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            // Return token in Authorization header instead of cookie
            res.status(200)
               .header('Authorization', `Bearer ${token}`)
               .json({
                    user: {
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                });
        } else {
            res.status(401).json({
                message: "Password does not match"
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Server error during login"
        });
    }
};

const registerUser = async (req, res) => {
    try {
        const {firstName, lastName, email, password} = req.body;
        if (!firstName) {
            return res.json({
                error: "First name is required"
            })
        }
        if (!lastName) {
            return res.json({
                error: "Last name is required"
            })
        }
        if (!password) {
            return res.json({
                error: "Password is required"
            })
        }
        const exists = await User.findOne({email});
        if (exists) {
            return res.json({
                error: "Email is already registered"
            })
        }

        const hashedPassword = await hashPassword(password);
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        })
        await user.save();
        return res.json(user);
    } catch (err) {
        console.log(err)
    }
}

const getUser = (req, res) => {
    try {
        const {token} = req.cookies;
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
                if (err) throw err;
                res.json(user);
            })
        } else {
            res.json(null);
        }
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    loginUser,
    registerUser,
    getUser,
}