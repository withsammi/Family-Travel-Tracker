
const createUser = async(req,res) => {
    try {
        const {name,color} = req.body;

        return res.status(201).json({
            success: true,
            messsage: "User created",
            userName: name,
            colorGiven: color
        })
    } catch (error) {
        console.log(error);
    }
}

export default createUser