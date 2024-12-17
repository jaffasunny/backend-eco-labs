const registerUser = asyncHandler(async (req: Request, res: Response) => {
const {
name,
email,
password,
roles,
propertyName,
propertyLocation,
propertySize,
} = req.body;

const file = req.file;

if (!name || !email || !password) {
throw new ApiError(400, 'Please fill all details!');
}

const existedUser = await User.findOne({ $or: [{ email }] });

if (existedUser) {
throw new ApiError(409, `Username or Email has already been used.`);
}

// upload image to cloudinary
if (!file) {
return res.status(400).json({ message: 'No file uploaded' });
}

const session = await mongoose.startSession();
session.startTransaction();

try {
const [user] = await User.create(
[
{
name,
email,
password,
roles,
},
],
{ session }
);

    const [property] = await Property.create(
      [
        {
          propertyName,
          propertyLocation,
          propertySize,
          landAssessmentReport: {
            url: file.path,
            public_id: file.filename,
          },
          landowner: user._id,
        },
      ],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();

    // Fetch user with populated property
    const userWithProperty = await Property.findById(property._id)
      .populate({
        path: 'landowner', // Populate the landowner_id field
        select: '_id name email roles phone', // Select the fields you want to include
      }) // Adjust this path if needed
      .select('-password -refreshToken');

    if (!userWithProperty) {
      throw new ApiError(500, 'Failed to fetch user after creation');
    }

    console.log({ userWithProperty });

    return res
      .status(201)
      .json(
        new ApiResponse(200, userWithProperty, 'User registered Successfully!')
      );

} catch (error: any) {
// Rollback transaction on error
if (session.inTransaction()) {
await session.abortTransaction();
}
throw new ApiError(500, error.message || 'Registration failed!');
} finally {
// Always end the session
session.endSession();
}
});
