const Breakfasts = require("../models/breakfasts.models")

const getById = (breakfastId) => {
    return Breakfasts.findById(breakfastId, (err, breakfast) => {
        if (err) console.log(err)
        return breakfast
    }).clone()
}

//Like Post
exports.postLikeBreakfast = async (req, res, next) => {
    try {
        const { breakfastId } = req.body
        const breakfast = await getById(breakfastId)

        breakfast.likes = breakfast.likes + 1
        await breakfast.save()
        res.send({ success: true })

    } catch (error) {
        console.log(error)
        res.status(400).json({ error })
    }

}
