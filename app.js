// HINT: anything that says ID... just get ready for GUIDs

/*
    HERE LIES ALL THE CLASSES THAT WE WILL BE MAKING OBJECTS OUT OF THROUGHOUT
    OUR BACKEND... it's a lot
    
    Email Class:
    - The `Email` class will be used when creating and managing user emails. It will track email addresses for each user, including whether an email is valid and its type (e.g., work, personal).
    - In the future, routes to add and validate emails could be created, using this class to store the relevant information.
    
    PhoneNumber Class:
    - The `PhoneNumber` class is responsible for capturing phone numbers associated with a user. Each phone number will have a type (e.g., mobile, work) and a flag indicating whether the number is valid.
    - Use this for adding/removing phone numbers or updating their validation status.
    
    InventoryItem Class:
    - The `InventoryItem` class handles the tracking of items in inventory, including quantities, associated employees, and other relevant details like cost and expiration dates.
    - This class will be used in inventory-related features such as adding new items, tracking changes, and setting reorder amounts.

    Ingredient Class:
    - The `Ingredient` class tracks the details of each ingredient (description, category, and measurements). This will be important for managing the kitchen or storage inventories.
    - It might be expanded with routes to fetch, add, or update ingredients.

    Session Class:
    - The `Session` class manages session information for each logged-in user. It's linked to a user by `userID`. Whenever a user logs in or out, a new session is created or removed.
*/

// User class to group our user data together.
class User {
    constructor(user_id, firstname, lastname, username, password, userType) {
        this.UserID = user_id; // Primary Key
        this.FirstName = firstname;
        this.LastName = lastname;
        this.Username = username;
        this.Password = password;
        this.UserType = userType; // Manager or Employee
    }
}

class Session {
    constructor(sess_id, emp_id) {
        this.SessionID = sess_id; // Primary
        this.UserID = emp_id; // Foreign to tblUser
    }
}

class Email {
    constructor(email_id, emailAddress, user_id, type, valid) {
        this.EmailID = email_id; // Primary
        this.EmailAddress = emailAddress;
        this.UserID = user_id;
        this.Type = type; // EmailType
        this.Valid = valid;
    }
}


class EmailType {
    constructor(type_id, desc, active) {
        this.TypeID = type_id; // Primary
        this.Description = desc;
        this.Active = active;
    }
}

class PhoneNumber {
    constructor(phone_num_id, areaCode, number, type, valid, user_id) {
        this.PhoneNumberID = phone_num_id; // Primary
        this.AreaCode = areaCode;
        this.Number = number;
        this.Type = type; // PhoneType
        this.Valid = valid;
        this.UserID = user_id; // genuinely no clue what this is about
    }
}

class PhoneType {
    constructor(type_id, desc, active) {
        this.TypeID = type_id; // Primary
        this.Description = desc;
        this.Active = active;
    }
}

class Ingredient {
    constructor(ing_id, desc, cat, measurement, maxAmt, reorderAmt, minAmt) {
        this.IngredientID = ing_id;
        this.Description = desc;
        this.Category = cat;
        this.Measurement = measurement;
        this.MaxAmount = maxAmt;
        this.ReorderAmount = reorderAmt;
        this.MinAmount = minAmt;
    }
}

class InventoryItem {
    constructor(entry_id, quantity, emp_id, notes, cost, addDate, expDate, PO_num, recipe_id) {
        this.EntryID = entry_id;
        this.Quantity = quantity;
        this.userID = emp_id;
        this.Notes = notes;
        this.Cost = cost;
        this.AddDate = addDate;
        this.ExpDate = expDate;
        this.PONumber = PO_num;
        this.RecipeID = recipe_id;
    }
}

// this will need to be used with the getRecipeInfo endpoint to be able to return all necessary info
// to the frontend ABOUT the recipe (i.e., its ingredients, tools, etc)
class Recipe {
    constructor(recipe_id, name, notes, yield_amount, product_id, prep_time, bake_time) {
        this.RecipeID = recipe_id;
        this.Name = name;
        this.Notes = notes;
        this.YieldAmount = yield_amount;
        this.ProductID = product_id;
        this.PrepTime = prep_time;
        this.BakeTime = bake_time;
        // added these because the frontend will need them to generate full Recipe information cards
        this.Ingredients = []; // this will need to be a dynamic array because ingredient count is unknown. (This will hold each Ingredient reorder/min amt too)
        this.Tools = []; // same reason here
    }
}

class EmpTimesheet {
    constructor(type_id, user_id) {
        this.TypeID = type_id;
        this.UserID = user_id;
    }
}

class Vendor {
    constructor(vendor_id, vendor_name, address_id, phone_number_id, email_id, notes, ingredient_id, ingredient_quantity, ingredient_price, price_per_unit) {
        this.VendorID = vendor_id;
        this.VendorName = vendor_name;
        this.AddressID = address_id;
        this.PhoneNumberID = phone_number_id;
        this.EmailID = email_id;
        this.Notes = notes;
        this.IngredientID = ingredient_id;
        this.IngredientQuantitiy = ingredient_quantity;
        this.IngredientPrice = ingredient_price;
        this.PricePerUnit = price_per_unit;
    }
}

class EmpAvailability {
    constructor(user_ID, week_ID, day_ID, shift_One, shift_two)
    {
        this.UserID = user_ID;
        this.WeekID = week_ID;
        this.DayID = day_ID;
        this.ShiftOne = shift_One;
        this.ShiftTwo = shift_Two;
    }
}

class Days {
    constructor(shift_One, shift_Two, day_ID){
        this.ShiftOne = shift_One;
        this.ShiftTwo = shift_Two;
        this.DayID = day_ID;
    }
}

const express = require('express');
const session = require('express-session');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { pool, poolConnect } = require('./databaseConnection'); 
const createTables = require('./createTables');

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use(session({
    genid: () => uuid.v4(),
    secret: process.env.AZURE_SQL_SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.AZURE_SQL_NODE_ENV === 'production', 
        httpOnly: true,
        sameSite: 'lax'
    }
}));

createTables();



async function hashPassword(password) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
}

// Compare password
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Find an exisiting user, similar to authenticate but has its dedicated function for readability
async function findUser(username) {
    try {
        console.log(username)
        const request = pool.request();
        const response = await request.input('Username', sql.NVarChar, username)
            .query('SELECT * FROM tblUser WHERE Username = @Username');
        return response.recordset[0]; // will be null or something now :)
    } catch (error) {
        console.log(error)
        throw error;
    }
}

// Add a new user
async function addUser(newUser) {
    try {
        const existingUser = await findUser(newUser.Username);
        if (existingUser) {
            throw new Error('new user already exists'); //did not check for new user originally 
        }
        const hashedPassword = await hashPassword(newUser.Password);
        const request = pool.request();
        await request.input('UserID', sql.NVarChar, newUser.UserID)
            .input('FirstName', sql.NVarChar, newUser.FirstName)
            .input('LastName', sql.NVarChar, newUser.LastName)
            .input('Username', sql.NVarChar, newUser.Username)
            .input('Password', sql.NVarChar, hashedPassword)
            .input('UserType', sql.Bit, newUser.UserType)
            .query('INSERT INTO tblUser (UserID, FirstName, LastName, Username, Password, UserType) VALUES (@UserID, @FirstName, @LastName, @Username, @Password, @UserType)');
    } catch (error) {
        console.log(error)
        throw error;
    }
}

// Authenticate user
async function authenticateUser(username, password) {
    try {
        const request = pool.request();
        const result = await request.input('Username', sql.NVarChar, username)
            .query('SELECT * FROM tblUser WHERE Username = @Username');
        if (result.recordset.length === 0) {
            return null;
        }
        const user = result.recordset[0];
        const isValid = await comparePassword(password, user.Password);
        if (!isValid) {
            return null;
        }

        // Create a User object with the retrieved data
        return new User(user.UserID, user.FirstName, user.LastName, user.Username, user.Password, user.UserType);
    } catch (error) {
        throw error;
    }
}

// Add a new session
async function addSession(SessionID, UserID, UserType) {
    try {
        const request = pool.request();
        await request.input('SessionID', sql.NVarChar, SessionID)
            .input('UserID', sql.NVarChar, UserID)
            .input('UserType', sql.Bit, UserType)
            .query('INSERT INTO tblSession (SessionID, UserID, UserType) VALUES (@SessionID, @UserID, @UserType)');
    } catch (error) {
        throw error;
    }
}

// Remove a session
async function removeSession(SessionID) {
    try {
        const request = pool.request();
        await request.input('SessionID', sql.NVarChar, SessionID)
            .query('DELETE FROM tblSession WHERE SessionID = @SessionID');
    } catch (error) {
        throw error;
    }
}

//Removes a Recipe
async function removeRecipe(recipeID) {
    try {
        const request = pool.request();
        await request.input('RecipeID', sql.NVarChar, recipeID)
            .query('DELETE FROM tblRecipe WHERE RecipeID = @RecipeID');
    } catch (error) {
        throw error;
    }
}

//Removes an Ingredient
async function removeIngredient(ingredientID) {
    try {
        const request = pool.request();
        await request.input('IngredientID', sql.NVarChar, ingredientID)
            .query('DELETE FROM tblIngredient WHERE IngredientID = @IngredientID');
    } catch (error) {
        throw error;
    }
}

async function updateIngredient(ingredientName, newIngredientName, otherAttribute) {
    try {
        const request = pool.request();

        request.input('IngredientName', sql.NVarChar, ingredientName);
        request.input('NewIngredientName', sql.NVarChar, newIngredientName);
        request.input('OtherAttribute', sql.NVarChar, otherAttribute);

        const query = `UPDATE tblIngredient
                        SET Name = @NewIngredientName, OtherAttribute = @OtherAttribute
                        WHERE Name = @IngredientName
                        `;

        const result = await request.query(query);

        if (result.rowsAffected[0] > 0) {
            console.log('Ingredient updated successfully');
            return true;
        } else {
            console.log('Ingredient not found');
            return false;
        }
    } catch (error) {
        throw error;
    }
}

// Get user by session (used to automatically sign someone in based on SessionStorage for the web frontend, not sure about mobile just yet)
async function getUserBySession(sessionID) {
    try {
        console.log('Querying for sessionID:', sessionID);

        const request = pool.request();
        const result = await request.input('SessionID', sql.NVarChar, sessionID)
            .query('SELECT S.SessionID, S.UserID, S.UserType, U.FirstName, U.LastName FROM tblSession S INNER JOIN tblUser U ON S.UserID = U.UserID WHERE S.SessionID = @SessionID');
        if (result.recordset.length === 0) {
            return null;
        }
        const user = result.recordset[0];
        return new User(user.UserID, user.FirstName, user.LastName, user.Username, user.Password, user.UserType);
    } catch (error) {
        throw error;
    }
}

// Checks to make sure User had UserType of 1 (aka is a manager)
async function authenticateManager(username, password) {
    try {
        const request = pool.request();
        const result = await request.input('Username', sql.NVarChar, username)
            .query('SELECT * FROM tblUser WHERE Username = @Username AND UserType = 1');
        if (result.recordset.length === 0) {
            return null; // user is not a manager
        }
        const user = result.recordset[0];
        const isValid = await comparePassword(password, user.Password);
        if (!isValid) {
            return null;
        }

        // Create a User object with the retrieved data
        return new User(user.UserID, user.FirstName, user.LastName, user.Username, user.Password, user.UserType);
    } catch (error) {
        throw error;
    }
}

// this will most likely need to be a LOT more complicated to accomodate for the getRecipeInfo route
// that will need to be created later
async function getRecipeFromDb(recipeID) {
    try {
        //Connecting
        const request = pool.request();

        //Query to fetch
        const result = await request.input('RecipeID', sql.NVarChar, recipeID)
            .query(`SELECT * FROM tblRecipe WHERE RecipeID = @RecipeID`);

        //Checks to make sure it exists
        if (result.recordset.length == 0) {
            return null; //Doesn't exist
        }

        //Returns the whole object
        const recipe = result.recordset[0];
        return new Recipe(recipe.RecipeID, recipe.Name, recipe.Notes, recipe.YieldAmount, recipe.ProductID, recipe.PrepTime, recipe.BakeTime);

    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}


//Get ingredient helper function
async function getIngredientFromDb(ingredientName) {
    try {
        //Connecting
        const request = pool.request();

        //Query to fetch
        const result = await request.input('Ingredient', sql.NVarChar, ingredientName)
            .query(`SELECT * FROM tblIngredient WHERE Name = @Ingredient`);

        //Checks to make sure it exists
        if (result.recordset.length == 0) {
            return null; //Doesn't exist
        }

        //Returns the whole object
        const ingredient = result.recordset[0];
        return new Ingredient(ingredient.IngredientID, ingredient.Description, ingredient.Category, ingredient.Measurement, ingredient.MaxAmount, ingredient.ReorderAmount, ingredient.MinAmount);

    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// probably going to need this one to be able to pull the names depending on the category its in.
async function getRecipeNames(category) {
    try {
        //Connecting
        const request = pool.request();

        // fetch all recipe names associated with a category (i.e., category = cake, result should be "[chocolate, strawberry, vanilla...]")
        const result = await request.input('Category', sql.NVarChar, category)
            .query(`SELECT r.RecipeID, r.Name 
                                            FROM tblRecipe r JOIN tblProduct p ON r.ProductID = p.ProductID JOIN tblProductCategory pc 
                                            ON p.ProductCategoryID = pc.ProductCategoryID WHERE pc.Name = @Category;`);

        if (!result) {
            return null;
        }

        return result.recordset;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

async function getIngredientNames() {
    try {
        const request = pool.request();
        const result = await request.query(`SELECT I.IngredientID, Name, Quantity FROM tblInventory V join tblIngredient I on I.IngredientID = V.IngredientID;`);
        if (!result) {
            return null;
        }
        return result.recordset;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

async function getVendorNames() {
    try {
        const request = pool.request();
        const result = await request.query(`SELECT VendorID, VendorName FROM tblVendor;`);
        if (!result) {
            return null;
        }
        return result.recordset;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

async function getProductNames() {
    try {
        const request = pool.request();
        const result = await request.query(`SELECT ProductID, Name FROM tblProduct;`);
        if (!result) {
            return null;
        }
        return result.recordset;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

async function getEquipNames() {
    try {
        const request = pool.request();
        const result = await request.query(`SELECT EquipmentID, Name FROM tblEquipment;`);
        if (!result) {
            return null;
        }
        return result.recordset;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

async function getTimesheetFromDb(typeID) {
    try {
        //Connecting
        const request = pool.request();

        //Query to fetch
        const result = await request.input('TypeID', sql.NVarChar, typeID)
            .query(`SELECT * FROM tblEmployeeTime WHERE TypeID = @TypeID`);

        //Checks to make sure it exists
        if (result.recordset.length == 0) {
            return null; //Doesn't exist
        }

        //Returns the whole object
        const timesheet = result.recordset[0];
        return new EmpTimesheet(timesheet.TypeID, timesheet.UserID);

    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

//Vendor Delete Help
async function removeVendor(vendorID) {
    try {
        const request = pool.request();
        await request.input('VendorID', sql.NVarChar, vendorID)
            .query('DELETE FROM tblVendor WHERE VendorID = @VendorID');
    } catch (error) {
        throw error;
    }
}

// Registration route with frontend input validation
app.post('/api/users', async (req, res) => {
    try {
        const { firstname, lastname, username, password, usertype } = req.body;
        // generate a new GUID
        const user_id = uuid.v4();
        // Create a new User instance
        const newUser = new User(user_id, firstname, lastname, username, password, usertype);
        // Save the new user to the database
        await addUser(newUser);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.number === 2627) { // SQL Server unique constraint error
            res.status(400).json({ error: 'Account with that username already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

async function getEmpBiHours(userID) {
    try {
        const request = pool.request();
        let response;

        if (!userID) {
            response = await request.query('SELECT * FROM vwBiWeekHoursSummary');
        } else {
            response = await request.input('UserID', sql.NVarChar, userID)
                .query('SELECT * FROM vwBiWeekHoursSummary WHERE userID = @UserID');
        }

        response.recordset.forEach(record => {
            record.TotalNormalHours = parseFloat(record.TotalNormalHours).toFixed(2);
            record.TotalOvertimeHours = parseFloat(record.TotalOvertimeHours).toFixed(2);
            record.TotalHolidayHours = parseFloat(record.TotalHolidayHours).toFixed(2);
        });

        return userID ? response.recordset[0] : response.recordset;

    } catch (error) {
        throw error;
    }
}

// manager endpoint to retrieve ALL users with hours if no query is provided OR
// if a userID IS provided, returns a single users data.
app.get('/api/manager/employeeHours', async (req, res) => {
    try {
        const { sessionID } = req.query;
        //const user = await getUserBySession(sessionID);
        if (!sessionID) {
            res.status(401).json({ error: "Unauthorized access!" });
        }
        const response = await getEmpBiHours();
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// manager endpoint to retrieve ALL users with hours if no query is provided OR
// if a userID IS provided, returns a single users data.
app.get('/api/employee/employeeHours', async (req, res) => {
    try {
        const { sessionID } = req.query;
        const user = await getUserBySession(sessionID);
        if (!user) {
            res.status(401).json({ error: "Unauthorized access!" });
        }
        const response = await getEmpBiHours(user.UserID);
        if(!response) {
            res.status(404).json({ error: "No clocked hours!" });
        }
        else {
            res.status(200).json(response);
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Availability route (findUser)
app.get('/api/users', async (req, res) => {
    try {
        const { username } = req.query;
        const user = await findUser(username);
        if (!user) {
            res.status(200).json({ message: 'Username is available!' });
            return;
        }
        res.status(400).json({ error: 'Account with that username already exists' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login route for employee with frontend input validation
app.post('/api/sessions/employee', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Authenticate the user
        const user = await authenticateUser(username, password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Create a session entry in tblSession
        const newSession = uuid.v4();
        await addSession(newSession, user.UserID, 0);
        res.status(200).json({ message: 'Logged in successfully', session: newSession });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login route for manager with frontend input validation
app.post('/api/sessions/manager', async (req, res) => {
    try {
        const { username, password, managerID } = req.body;
        if (managerID != 123456) { // CHANGE THIS TO BE MORE SECURE IN A LATER SPRINT
            return res.status(401).json({ error: 'Invalid Manager ID' });
        }
        // Authenticate the user
        const user = await authenticateManager(username, password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials for manager access' });
        }
        // Create a session entry in tblSession
        const newSession = uuid.v4();
        await addSession(newSession, user.UserID, 1);
        res.status(200).json({ message: 'Logged in successfully', session: newSession });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout route
app.delete('/api/sessions', async (req, res) => {
    try {
        const { sessionID } = req.body;
        // Remove the session entry from tblSession
        await removeSession(sessionID);
        // Destroy the session
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Saved-session login thingy :)
app.get('/api/sessions', async (req, res) => {
    try {
        const { sessionID } = req.query;
        // Get the user based on the session ID
        const user = await getUserBySession(sessionID);
        if (!user) {
            return res.status(401).json({ error: 'Session expired, please log in again' });
        }
        res.status(200).json({ message: `Welcome ${user.FirstName} ${user.LastName}`, isManager: `${user.UserType}` });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Recipe GET
app.get('/api/recipe', async (req, res) => {
    const recipeID = req.query.id;
    if (recipeID) {
        try {
            const recipe = await getRecipeFromDb(recipeID);

            if (recipe) {
                res.status(200).json(recipe);   //Sends as a JSON response
            } else {
                res.status(404).send('Recipe not found');
            }
        } catch (error) {
            res.status(500).send('Error fetching recipe');
        }
    } else {
        res.status(500).json({ error: 'Internal serval error' });
    }
});

//RecipeNames GET
app.get('/api/recipeNames', async (req, res) => {
    try {
        const { category } = req.query;
        const recipeNames = await getRecipeNames(category);

        if (recipeNames) {
            if (recipeNames.length > 0) {
                res.status(200).json(recipeNames);
            } else {
                res.status(404).send('No recipes found');
            }
        }
    } catch (error) {
        res.status(500).send('Error retrieving recipes');
        res.status(500).json({ error: 'Error retrieving recipes', message: error.message });
    }
});

//Employee Timesheets GET
app.get('/api/employeeTimesheet', async (req, res) => {
    const typeID = req.query;
    if (typeID) {
        try {
            const timesheet = await getTimesheetFromDb(typeID);

            if (timesheet) {
                res.status(200).json(timesheet);   //Sends as a JSON response
            } else {
                res.status(404).send('Timesheet not found');
            }
        } catch (error) {
            res.status(500).send('Error fetching timesheet');
        }
    } else {
        res.status(500).json({ error: 'Internal serval error' });
    }
});

//Recipe DELETE
app.delete('/api/recipe', async (req, res) => {
    try {
        const { recipeID } = req.body;

        //Removes
        await removeRecipe(recipeID);

        //Destroys
        res.status(200).json({ message: 'Recipe Successfully Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

//ingredient GET
app.get('/api/ingredient', async (req, res) => {
    const ingredientName = req.query.name;
    if (!ingredientName) {
        return res.status(400).json({ error: 'Invalid request', message: 'Ingredient name is required' });
    }
    try {
        const request = pool.request();
        request.input('IngredientName', sql.NVarChar, ingredientName);
        const result = await request.query('SELECT * FROM tblIngredient WHERE Name = @IngredientName');
        const ingredient = result.recordset[0];

        if (ingredient) {
            ingredient.MaxAmount = parseFloat(ingredient.MaxAmount).toFixed(2);
            ingredient.MinAmount = parseFloat(ingredient.MinAmount).toFixed(2);
            ingredient.ReorderAmount = parseFloat(ingredient.ReorderAmount).toFixed(2);

            res.status(200).json(ingredient);  // Send the formatted ingredient as a JSON response
        } else {
            res.status(404).send('Ingredient not found');
        }
    } catch (error) {
        res.status(500).send('Error fetching ingredient');
    }
});

//Ingredient DELETE
app.delete('/api/ingredient', async (req, res) => {
    try {
        const { ingredientID } = req.body;

        //Removes
        await removeIngredient(ingredientID);

        //Destroys
        res.status(200).json({ message: 'Ingredient Successfully Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

//UPDATE for Ingredient Table
app.put('/api/ingredient', async (req, res) => {
    //Gets the argruments
    await poolConnect;
    const request = pool.request();

    try {
        const { ingredientID, name, description, measurement, max, 
            reorder, min, allergen } = req.body;

        if(!ingredientID) {
            res.status(400).json({message : 'Missing ingredientID'});
        }

        //Change Ingredient Name
        if (name) {
            const changeNameQuery = `UPDATE tblIngredient
                                    SET Name = @name
                                    WHERE IngredientID = @ingredientID`;
            request.input('name', sql.NVarChar, name);
            request.input('ingredientID', sql.NVarChar, ingredientID);
            const result = await request.query(changeNameQuery);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Ingredient name failed to update or no ingredient found'});
            }
        }

        //Change Ingredient Description
        if (description) {
            const descriptionQuery = `UPDATE tblIngredient
                                    SET Description = @description
                                    WHERE IngredientID = @ingredientID`;
            request.input('description', sql.NVarChar, description);
            request.input('ingredientID', sql.NVarChar, ingredientID);
            const result = await request.query(descriptionQuery);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Ingredient description failed to update or no ingredient found'});
            }
        }

        //Change Ingredient Measurement
        if (measurement) {
            const measurementQuery = `UPDATE tblIngredient
                                    SET Measurement = @measurement
                                    WHERE IngredientID = @ingredientID`;
            request.input('measurement', sql.NVarChar, measurement);
            request.input('ingredientID', sql.NVarChar, ingredientID);
            const result = await request.query(measurementQuery);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Ingredient measurement failed to update or no ingredient found'});
            }
        }

        //Change Ingredient Max Amount
        if (max) {
            const maxQuery = `UPDATE tblIngredient
                                    SET MaxAmount = @max
                                    WHERE IngredientID = @ingredientID`;
            request.input('max', sql.Decimal, max);
            request.input('ingredientID', sql.NVarChar, ingredientID);
            const result = await request.query(maxQuery);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Ingredient max amount failed to update or no ingredient found'});
            }
        }

        //Change Ingredient Reorder Amount
        if (reorder) {
            const reorderQuery = `UPDATE tblIngredient
                                    SET ReorderName = @reorder
                                    WHERE IngredientID = @ingredientID`;
            request.input('reorder', sql.Decimal, reorder);
            request.input('ingredientID', sql.NVarChar, ingredientID);
            const result = await request.query(reorderQuery);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Ingredient reorder amount failed to update or no ingredient found'});
            }
        }

        //Change Ingredient Min Amount
        if (min) {
            const minQuery = `UPDATE tblIngredient
                                    SET MinAmount = @min
                                    WHERE IngredientID = @ingredientID`;
            request.input('min', sql.Decimal, min);
            request.input('ingredientID', sql.NVarChar, ingredientID);
            const result = await request.query(minQuery);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Ingredient min amount failed to update or no ingredient found'});
            }
        }

        //Change Ingredient Allergen
        if (allergen) {
            const allergenQuery = `UPDATE tblIngredient
                                    SET Allergen = @allergen
                                    WHERE IngredientID = @ingredientID`;
            request.input('allergen', sql.bit, allergen);
            request.input('ingredientID', sql.NVarChar, ingredientID);
            const result = await request.query(allergenQuery);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Ingredient allergen failed to update or no ingredient found'});
            }
        }

        if (rowsUpdated) {
            return res.status(404).json({ message: 'Ingredient Updated Successfully'});
        } else {
            return res.status(400).json({ message: 'No Updates Were Made'});
        }
    } catch (error) {
        console.error('Error updating ingredient:', error);
        return res.status(500).json({ message: 'Error Updating ingredient: ', error});
    }
});

// Retrieves list of InventoryItems (IngredientNames, VendorNames, etc)
app.get('/api/inventoryItems', async (req, res) => {
    try {
        const { category } = req.query;
        let inventoryItems;
        if (category == 'Ingredients') {
            inventoryItems = await getIngredientNames();
            inventoryItems.forEach((item) => {
                item.Quantity = parseFloat(item.Quantity).toFixed(2)
                item.Category = "Ingredients";
            })
        }
        else if (category == 'Products') {
            inventoryItems = await getProductNames();
            inventoryItems.forEach((item) => {
                item.Category = "Products";
            })
        }
        else if (category == 'Vendors') {
            inventoryItems = await getVendorNames();
            inventoryItems.forEach((item) => {
                item.Category = "Vendors";
            })
        }
        else if (category == 'Equipment') {
            inventoryItems = await getEquipNames();
            inventoryItems.forEach((item) => {
                item.Category = "Equipment";
            })
        }
        else {
            res.status(404).json({ error: 'Invalid category!' });
            return;
        }

        if (inventoryItems) {
            if (inventoryItems.length > 0) {
                res.status(200).json(inventoryItems);
            } else {
                res.status(404).send('No ingredients found');
            }
        }
    } catch (error) {
        res.status(500).send('Error retrieving ingredients');
        res.status(500).json({ error: 'Error retrieving ingredients', message: error.message });
    }
});

//Get Ingredient Info
app.get('/api/ingredientInfo', async (req, res) => {
    const { ingredientID } = req.query;

    if (ingredientID) {
        try {
            const request = pool.request();
            let query = '';
            request.input('IngredientID', sql.NVarChar, ingredientID);
            query = 'SELECT * FROM vwIngredientInfo WHERE IngredientID = @IngredientID';

            const result = await request.query(query);
            const ingredientInfo = result.recordset[0]; // Retrieve the first record

            if (ingredientInfo) {
                ingredientInfo.TotalQuantity = parseFloat(ingredientInfo.TotalQuantity).toFixed(2)
                res.status(200).json(ingredientInfo);
            } else {
                res.status(404).send('Ingredient not found');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error fetching ingredient information');
        }
    } else {
        res.status(400).json({ error: 'Ingredient name or ID is required' });
    }
});

//Get product Info
app.get('/api/productInfo', async (req, res) => {
    const { productID } = req.query;

    if (productID) {
        try {
            const request = pool.request();
            let query = '';
            request.input('ProductID', sql.NVarChar, productID);
            query = 'SELECT * FROM tblProduct WHERE ProductID = @ProductID';

            const result = await request.query(query);
            const productInfo = result.recordset[0]; // Retrieve the first record

            if (productInfo) {
                res.status(200).json(productInfo);
            } else {
                res.status(404).send('Product not found');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error fetching product information');
        }
    } else {
        res.status(400).json({ error: 'product name or ID is required' });
    }
});

//Get FINISHED product info
app.get('/api/finishedProfuctInfo', async (req, res) => {
    try{
        const requrest = pool.requrest();
        let query = '';
        query = 'SELECT * FROM vwProductInfo';

        const result = await request.query(query);
        const finishedProductInfo = result.recordset;

        if (finishedProductInfo) {
            res.status(200).json(finishedProductInfo);
        } else {
            res.status(404).send('No finished products found.');
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching finished product information');
    }
});

//Get Vendor Info
app.get('/api/vendorInfo', async (req, res) => {
    const { vendorID } = req.query;

    if (vendorID) {
        try {
            const request = pool.request();
            let query = '';
            request.input('VendorID', sql.NVarChar, vendorID);
            query = 'SELECT * FROM vwVendorInfo WHERE VendorID = @VendorID';

            const result = await request.query(query);
            const vendorInfo = result.recordset[0]; // Retrieve the first record

            if (vendorInfo) {
                res.status(200).json(vendorInfo);
            } else {
                res.status(404).send('Vendor not found');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error fetching vendor information');
        }
    } else {
        res.status(400).json({ error: 'vendor name or ID is required' });
    }
});

//Get Equipment Info
app.get('/api/equipmentInfo', async (req, res) => {
    const { equipmentID } = req.query;

    if (equipmentID) {
        try {
            const request = pool.request();
            let query = '';
            request.input('EquipmentID', sql.NVarChar, equipmentID);
            query = 'SELECT * FROM tblKitchenEquipment WHERE EquipmentID = @EquipmentID';

            const result = await request.query(query);
            const equipmentInfo = result.recordset[0]; // Retrieve the first record

            if (equipmentInfo) {
                res.status(200).json(equipmentInfo);
            } else {
                res.status(404).send('Equipment not found');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error fetching equipment information');
        }
    } else {
        res.status(400).json({ error: 'equipment ID is required' });
    }
});

// Recipe Get info 
app.get('/api/recipeInfo', async (req, res) => {
    const { recipeID } = req.query;

    if (recipeID) {
        try {
            const request = pool.request();
            let query = '';
            request.input('RecipeID', sql.NVarChar, recipeID);
            query = 'SELECT * FROM vwRecipeInfo WHERE RecipeID = @RecipeID';

            const result = await request.query(query);
            const recipeInfo = result.recordset[0]; // Retrieve the first record

            if (recipeInfo) {
                res.status(200).json(recipeInfo);
            } else {
                res.status(404).send('Recipe not found');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error fetching recipe information');
        }
    } else {
        res.status(400).json({ error: 'Recipe name or ID is required' });
    }
});

//TESTED == WORK
app.get('/api/checkRecipeIngredients', async (req, res) => {
    const recipeID = req.query.recipeID;
    const quantity = req.query.quantity;

    if (!recipeID || !quantity) {
        return res.status(400).json({ error: 'RecipeID and quantity are required' });
    }

    try {
        const result = await pool.request()
            .input('recipeID', sql.NVarChar, recipeID)
            .input('DesiredQuantity', sql.Int, quantity)
            .execute('CheckRecipeIngredients');

        let responseArray = result.recordset.map(row => {
            let isSufficient = (row.IsSufficient === 'TRUE') ? 1 : 0;
            return { RecipeID: row.IngredientID, available: isSufficient };
        });

        res.status(200).json(responseArray);

    } catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).json({ message: 'Error fetching ingredients' });
    }
});



// Function to add a product category
async function addProductCategory(newProductCategory) {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();

        // Insert query
        const query = `
            INSERT INTO tblProductCategory (ProductCategoryID, Name, Description)
            VALUES (@ProductCategoryID, @Name, @Description)
        `;

        // Input parameters
        request.input('ProductCategoryID', sql.NVarChar, newProductCategory.ProductCategoryID);
        request.input('Name', sql.NVarChar, newProductCategory.Name);
        request.input('Description', sql.NVarChar, newProductCategory.Description);

        // Execute the query
        await request.query(query);

        console.log('Product category added successfully');
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// POST endpoint to add a product category
app.post('/api/productCategory', async (req, res) => {
    const { Name, Description } = req.body;

    if (!Name || !Description) {
        return res.status(400).send('Missing required fields');
    }
    if (typeof Name !== 'string' || typeof Description !== 'string') {
        return res.status(400).json({ error: 'Invalid request', message: 'Name and description must be strings' });
    }

    const ProductCategoryID = uuid.v4(); // Generate a UUID for ProductCategoryID

    try {
        await addProductCategory({ ProductCategoryID, Name, Description });
        res.status(201).send('Product category added successfully');
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});




// Function to add a product
async function addProduct(newProduct) {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();

        // Insert query
        const query = `
            INSERT INTO tblProduct (ProductID, Name, Description, ProductCategoryID)
            VALUES (@ProductID, @Name, @Description, @ProductCategoryID)
        `;

        // Input parameters
        request.input('ProductID', sql.NVarChar, newProduct.ProductID);
        request.input('Name', sql.NVarChar, newProduct.Name);
        request.input('Description', sql.NVarChar, newProduct.Description);
        request.input('ProductCategoryID', sql.NVarChar, newProduct.ProductCategoryID);

        // Execute the query
        await request.query(query);

        console.log('Product added successfully');
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// POST endpoint to add a product
app.post('/api/product', async (req, res) => {
    const { Name, Description, ProductCategoryID } = req.body;

    if (!Name || !Description || !ProductCategoryID) {
        return res.status(400).send('Missing required fields');
    }
    if (typeof Name !== 'string' || typeof Description !== 'string' || typeof ProductCategoryID !== 'string') {
        return res.status(400).json({ error: 'Invalid request', message: 'Name, description, and product category ID must be strings' });
    }
    const ProductID = uuid.v4(); // Generate a UUID for ProductID

    try {
        await addProduct({ ProductID, Name, Description, ProductCategoryID });
        res.status(201).send('Product added successfully');
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

// Function to delete a product
async function deleteProduct(ProductID) {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();

        // Delete query based on ProductID
        const query = `
            DELETE FROM tblProduct
            WHERE ProductID = @ProductID
        `;

        request.input('ProductID', sql.NVarChar, ProductID);
        await request.query(query);

        console.log('Product deleted successfully');
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// DELETE endpoint to remove a product
app.delete('/api/productDelete', async (req, res) => {
    const { ProductID } = req.body;

    if (!ProductID) {
        return res.status(400).send('Product ID is required');
    }

    try {
        await deleteProduct(ProductID);
        res.status(200).send('Product deleted successfully');
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

// POST endpoint to add a recipe
app.post('/api/recipe', async (req, res) => {
    const { Name, Notes, YieldAmount, ProductID, PrepTime, BakeTime } = req.body;

    if (!Name || !YieldAmount || !ProductID || !PrepTime || !BakeTime) {
        return res.status(400).send('Missing required fields');
    }
    if (typeof Name !== 'string' || typeof Notes !== 'string' || typeof ProductID !== 'string' || typeof PrepTime !== 'string' || typeof BakeTime !== 'string') {
        return res.status(400).json({ error: 'Invalid request', message: 'Name, notes, product ID, prep time, and bake time must be strings' });
    }

    try {
        // Parse and validate time to ensure it's in the correct format HH:mm:ss
        const formatTime = (time) => {
            const matches = time.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?$/);
            if (!matches) return null;
            return `${matches[1]}:${matches[2]}:${matches[3]}`;  // Strip off unnecessary fractions
        };

        const formattedPrepTime = formatTime(PrepTime);
        const formattedBakeTime = formatTime(BakeTime);

        if (!formattedPrepTime || !formattedBakeTime) {
            return res.status(400).send('Invalid time format. Use HH:mm:ss');
        }

        const RecipeID = uuid.v4(); // Generate a UUID for RecipeID

        await poolConnect; // Ensure the pool is connected
        const request = pool.request();
        const query = `
            INSERT INTO tblRecipe (RecipeID, Name, Notes, YieldAmount, ProductID, PrepTime, BakeTime)
            VALUES (@RecipeID, @Name, @Notes, @YieldAmount, @ProductID, CAST(@PrepTime AS TIME), CAST(@BakeTime AS TIME))
        `;

        // Input parameters
        request.input('RecipeID', sql.NVarChar, RecipeID);
        request.input('Name', sql.NVarChar, Name);
        request.input('Notes', sql.NVarChar, Notes);
        request.input('YieldAmount', sql.Int, YieldAmount);
        request.input('ProductID', sql.NVarChar, ProductID);
        request.input('PrepTime', sql.NVarChar, formattedPrepTime);  // Using NVarChar to pass time as string because sql.time seemed to not be compatible with mssql. It will be stored as TIME in the database
        request.input('BakeTime', sql.NVarChar, formattedBakeTime);

        await request.query(query);

        res.status(201).send('Recipe added successfully');
    } catch (err) {
        console.error('Error inserting recipe:', err);
        res.status(500).send('Internal server error');
    }
});

async function addIngredientCategory(newCategory) {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();

        // Insert query
        const query = `
            INSERT INTO tblIngredientCategory (IngredientCategoryID, Name, Description)
            VALUES (@IngredientCategoryID, @Name, @Description)
        `;

        // Input parameters
        request.input('IngredientCategoryID', sql.NVarChar, newCategory.IngredientCategoryID);
        request.input('Name', sql.NVarChar, newCategory.Name);
        request.input('Description', sql.NVarChar, newCategory.Description);

        // Execute the query
        await request.query(query);

        console.log('Ingredient category added successfully');
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

app.post('/api/ingredientCategory', async (req, res) => {
    const { Name, Description } = req.body;

    if (!Name || !Description) {
        return res.status(400).send('Missing required fields');
    }

    const IngredientCategoryID = uuid.v4(); // Generate a UUID for IngredientCategoryID

    try {
        await addIngredientCategory({ IngredientCategoryID, Name, Description });
        res.status(201).send('Ingredient category added successfully');
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

async function addIngredient(newIngredient) {
    try {
        await poolConnect;
        const request = pool.request();

        const query = `
            INSERT INTO tblIngredient (IngredientID, Name, Description, IngredientCategoryID, Measurement, MaxAmount, ReorderAmount, MinAmount, Allergen)
            VALUES (@IngredientID, @Name, @Description, @IngredientCategoryID, @Measurement, @MaxAmount, @ReorderAmount, @MinAmount, @Allergen)
        `;

        // Input parameters
        request.input('IngredientID', sql.NVarChar, newIngredient.IngredientID);
        request.input('Name', sql.NVarChar, newIngredient.Name);
        request.input('Description', sql.NVarChar, newIngredient.Description);
        request.input('IngredientCategoryID', sql.NVarChar, newIngredient.IngredientCategoryID);
        request.input('Measurement', sql.NVarChar, newIngredient.Measurement);
        request.input('MaxAmount', sql.Decimal(10, 2), newIngredient.MaxAmount);
        request.input('ReorderAmount', sql.Decimal(10, 2), newIngredient.ReorderAmount);
        request.input('MinAmount', sql.Decimal(10, 2), newIngredient.MinAmount);
        request.input('Allergen', sql.Bit, newIngredient.Allergen);

        // Execute the query
        await request.query(query);

        console.log('Ingredient added successfully');
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

async function addAvailability(UserID, WeekID, DayID, ShiftOne, ShiftTwo) {
    try {
        await poolConnect;
        const request = pool.request();



        // Input parameters
        request.input('UserID', sql.NVarChar, UserID);
        request.input('WeekID', sql.NVarChar, WeekID);
        request.input('DayID', sql.NVarChar, DayID);
        request.input('ShiftOne', sql.BIT, ShiftOne);
        request.input('ShiftTwo', sql.BIT, ShiftTwo);

        const query = `
            INSERT INTO tblAvailability (userID, weekID, dayID, shiftOne, shiftTwo)
            VALUES (@UserID, @WeekID, @DayID, @ShiftOne, @ShiftTwo)
        `;

        // Execute the query
        await request.query(query);

        console.log('Availability added successfully');
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

app.post('/api/ingredient', async (req, res) => {
    const { Name, Description, IngredientCategoryID, Measurement, MaxAmount, ReorderAmount, MinAmount, Allergen } = req.body;
    if (!Name || !Description || !IngredientCategoryID || !Measurement || !MaxAmount || !ReorderAmount || !MinAmount || Allergen === undefined) {
        return res.status(400).send('Missing required fields');
    }

    const IngredientID = uuid.v4(); // Generate a UUID for IngredientID

    try {
        await addIngredient({ IngredientID, Name, Description, IngredientCategoryID, Measurement, MaxAmount, ReorderAmount, MinAmount, Allergen });
        res.status(201).send('Ingredient added successfully');
    }
    catch (error) {
        res.status(500).send('Internal server error');
    }
});

async function getClockStatus(LogID) {
    try {
        const request = pool.request();

        const result = await request
            .input('LogID', sql.NVarChar, LogID)
            .query('SELECT clockOutTime FROM tblLog WHERE logID = @LogID');
        console.log(result)
        if (!result) {
            return null;
        }
        return result.recordset[0];
    } catch (error) {
        console.log(error);
    }
}

app.get('/api/clock', async (req, res) => {
    const { sessionID, logID } = req.query;
    console.log(sessionID, logID)

    if (!sessionID || !logID) {
        return res.status(400).json({ error: 'sessionID and logID are required' });
    }
    let user;
    if (!(user = await getUserBySession(sessionID))) {
        return res.status(401).json({ error: 'Session has expired!' });
    }
    // get clock status
    const status = await getClockStatus(logID);
    // if status is null, then clockOutTime is NULL, aka still clocked in
    // returns "clockOutTime: null/TIME"
    console.log(status)
    if (!status || !status.clockOutTime) {
        res.status(200).json({ status: 1 });
    }
    else {
        res.status(200).json({ status: 0 });
    }

})

//POST to add clock in time, userID, and dayID
app.post('/api/clockin', async (req, res) => {
    const { sessionID } = req.body;

    if (!sessionID) {
        return res.status(400).json({ error: 'Invalid request', message: 'Session ID is required' });
    }

    let user;
    if (!(user = await getUserBySession(sessionID))) {
        return res.status(401).json({ error: 'Session has expired!' });
    }

    try {
        await poolConnect;
        const request = pool.request();

        // Fixed start date as September 30, 2024
        const startDate = new Date('2024-09-30');
        const oneWeekLater = new Date(startDate);
        oneWeekLater.setDate(oneWeekLater.getDate() + 7);  

        let originalDateTime = new Date();  
        let mappedDate = new Date(originalDateTime);  

        if (mappedDate < startDate || mappedDate > oneWeekLater) {
            const diffInMs = mappedDate - startDate;
            const daysSinceStart = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            const adjustedDays = ((daysSinceStart % 7 + 7) % 7) + 1; 

            mappedDate = new Date(startDate);
            mappedDate.setDate(startDate.getDate() + adjustedDays);  

            mappedDate.setHours(originalDateTime.getHours());
            mappedDate.setMinutes(originalDateTime.getMinutes());
            mappedDate.setSeconds(originalDateTime.getSeconds());

            console.log(`Original date (${originalDateTime}) mapped to ${mappedDate}`);
        }


        const currentDate = mappedDate.toISOString().split('T')[0]; 

        const dayResult = await request
            .input('currentDate', sql.Date, currentDate)
            .query(`SELECT dayID FROM tblDay WHERE date = @currentDate`);

        if (dayResult.recordset.length === 0) {
            return res.status(404).json({ error: 'No dayID found for today\'s date' });
        }

        const dayID = dayResult.recordset[0].dayID;
        const logID = uuid.v4(); 

        await request
            .input('logID', sql.NVarChar, logID)
            .input('userID', sql.NVarChar, user.UserID)
            .input('dayID', sql.NVarChar, dayID)
            .input('clockInTime', sql.DateTime, mappedDate) 
            .input('isHoliday', sql.Bit, 0)
            .query(`INSERT INTO tblLog (logID, userID, dayID, clockInTime, clockOutTime, isHoliday) 
                    VALUES (@logID, @userID, @dayID, @clockInTime, NULL, @isHoliday)`);

        // Respond with success and logID
        res.status(200).json({ logID: logID, message: 'Clock-in time recorded successfully' });

    } catch (error) {
        console.error('Error recording clock-in time:', error);
        res.status(500).send('Error recording clock-in time');
    }
});


//POST to add clock out time, userID, and dayID
app.post('/api/clockout', async (req, res) => {
    const { sessionID } = req.body;

    if (!sessionID) {
        return res.status(400).json({ error: 'sessionID is required' });
    }
    
    let user;
    if (!(user = await getUserBySession(sessionID))) {
        return res.status(401).json({ error: 'Session has expired!' });
    }

    try {
        await poolConnect;
        const request = pool.request();

        const startDate = new Date('2024-09-30');
        const oneWeekLater = new Date(startDate);
        oneWeekLater.setDate(oneWeekLater.getDate() + 7); 

        let originalDateTime = new Date();
        let mappedDate = new Date(originalDateTime);  

        if (mappedDate < startDate || mappedDate > oneWeekLater) {
            const daysSinceStart = Math.floor((mappedDate - startDate) / (1000 * 60 * 60 * 24));
            const adjustedDays = ((daysSinceStart % 7 + 7) % 7) + 1;

            mappedDate = new Date(startDate);
            mappedDate.setDate(startDate.getDate() + adjustedDays); 

            mappedDate.setHours(originalDateTime.getHours());
            mappedDate.setMinutes(originalDateTime.getMinutes());
            mappedDate.setSeconds(originalDateTime.getSeconds());

            console.log(`Original date (${originalDateTime}) mapped to ${mappedDate}`);
        }

        const currentDate = mappedDate.toISOString().split('T')[0]; 

        const dayResult = await request
            .input('currentDate', sql.Date, currentDate)
            .query(`SELECT dayID FROM tblDay WHERE date = @currentDate`);

        if (dayResult.recordset.length === 0) {
            return res.status(404).json({ error: 'No dayID found for today\'s date' });
        }

        const dayID = dayResult.recordset[0].dayID;

        const result = await request
            .input('userID', sql.NVarChar, user.UserID)
            .input('dayID', sql.NVarChar, dayID)
            .input('clockOutTime', sql.DateTime, mappedDate) 
            .query(`UPDATE tblLog 
                    SET clockOutTime = @clockOutTime 
                    WHERE userID = @userID AND dayID = @dayID AND clockOutTime IS NULL`);
                    if (result.rowsAffected[0] > 0) {
                        const biWeekResult = await request
                            .input('mappedDate', sql.Date, currentDate)
                            .query(`
                                SELECT BiWeekID 
                                FROM tblBiWeek 
                                WHERE @mappedDate BETWEEN StartDate AND DATEADD(DAY, 13, StartDate)
                            `);
            
                        if (biWeekResult.recordset.length === 0) {
                            return res.status(404).json({ error: 'No BiWeekID found for this date range' });
                        }
            
                        const biWeekID = biWeekResult.recordset[0].BiWeekID;
            
                        const mergeQuery = `
                            WITH TimeInSeconds AS (
                                SELECT l.userID, l.dayID, 
                                       DATEDIFF(SECOND, l.clockInTime, l.clockOutTime) AS differenceInSeconds,
                                       b.BiWeekID
                                FROM tblLog l
                                JOIN tblBiWeek b 
                                ON l.clockInTime BETWEEN b.StartDate AND DATEADD(DAY, 13, b.StartDate)
                            )
                            MERGE tblHoursWorkedDay AS target
                            USING (
                                SELECT userID, dayID, BiWeekID, 
                                       ROUND(CAST(SUM(differenceInSeconds) AS FLOAT) / 3600, 2) AS totalWeekHours
                                FROM TimeInSeconds
                                GROUP BY userID, dayID, BiWeekID
                            ) AS source
                            ON target.userID = source.userID AND target.dayID = source.dayID AND target.BiWeekID = source.BiWeekID
                            WHEN MATCHED THEN
                                UPDATE SET target.NormalHours = CASE WHEN source.totalWeekHours <= 8 THEN source.totalWeekHours ELSE 8 END,
                                           target.OvertimeHours = CASE WHEN source.totalWeekHours > 8 THEN source.totalWeekHours - 8 ELSE 0 END,
                                           target.HolidayHours = 0
                            WHEN NOT MATCHED THEN
                                INSERT (HoursID, UserID, DayID, BiWeekID, NormalHours, OvertimeHours, HolidayHours)
                                VALUES (NEWID(), source.userID, source.dayID, source.BiWeekID, 
                                        CASE WHEN source.totalWeekHours <= 8 THEN source.totalWeekHours ELSE 8 END, 
                                        CASE WHEN source.totalWeekHours > 8 THEN source.totalWeekHours - 8 ELSE 0 END, 0);
                        `;
            

            await request
                .input('startDate', sql.Date, startDate)
                .input('endDate', sql.Date, oneWeekLater)
                .query(mergeQuery);

            res.status(200).json({ message: 'Clock-out time recorded and total hours updated successfully' });
        } else {
            res.status(404).json({ error: 'Log entry not found' });
        }
    } catch (error) {
        console.error('Error updating clock-out time and total hours:', error);
        res.status(500).send('Error updating clock-out time and total hours');
    }
});


async function mulRecipe(recipeID, num) {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();
        request.input('RecipeID', sql.NVarChar, recipeID);
        request.input('num', sql.Float, num);
        const result = await request.query(`
            SELECT ri.RecipeID, ri.IngredientID, re.ProductID, ri.Quantity * @num AS ScaledQuantity 
            FROM tblRecipeIngredient ri 
            JOIN tblRecipe re ON re.RecipeID = ri.RecipeID
            WHERE ri.RecipeID = @RecipeID
        `);
        return result.recordset;
    } catch (error) {
        console.error('Error multiplying recipe:', error);
        throw error;
    }
}

async function quantityCheck(ing) {
    try {
        await poolConnect;
        const request = pool.request();
        request.input('IngredientID', sql.NVarChar, ing.IngredientID);
        const check = await request.query(`
            SELECT SUM(inv.Quantity) AS TotalQuantity
            FROM tblInventory inv
            WHERE inv.IngredientID = @IngredientID AND GETDATE() <= inv.ExpireDateTime
        `);
        return check.recordset[0] && check.recordset[0].TotalQuantity < ing.ScaledQuantity;
    } catch (error) {
        console.error('Error checking valid quantities for recipe use:', error);
        throw error;
    }
}

async function deductInventory(ing) {
    try {
        await poolConnect;
        let curr = ing.ScaledQuantity;
        while (curr > 0) {

            const request = pool.request();
            request.input('IngredientID', sql.NVarChar, ing.IngredientID);
            //moved here so that it will grab a new ingredient each time that is in the inventory
            //when it was outside the loop it was grabbing one instance of each ingredient for the entire recipe
            //So if we had an instance of 10 and one of 1000, it would use the oldest(10), delete that ingredient instance in the inventory table
            //Then when it tried to use it, since there was not a new instance of an ingredient grabbed, it broke
            const result1 = await request.query(`
                SELECT TOP 1 *
                FROM tblInventory inv
                WHERE inv.IngredientID = @IngredientID AND GETDATE() <= inv.ExpireDateTime AND inv.Quantity > 0
                ORDER BY inv.ExpireDateTime
            `);

            if (result1.recordset.length === 0) {
                throw new Error('Not enough inventory available.');
            }

            let invItem = result1.recordset[0];  // Get the top inventory item
            let newQuantity = invItem.Quantity - curr;  // Calculate the new quantity
            curr = newQuantity * -1;  // Remaining quantity needed (if negative, it means we need more)

            request.input('EntityID', sql.NVarChar, invItem.EntityID);
            if (newQuantity <= 0) {  // If we took all the quantity from that row
                await request.query(`
                    DELETE FROM tblInventory
                    WHERE tblInventory.EntityID = @EntityID
                `);
            } else {  // There's still some quantity left
                request.input('NewQuantity', sql.Float, newQuantity);
                //REMOVED * -1: Was just making everything a negative. 
                //If a recipe needed 1 kilo butter and we had 1000 in inventory.
                //It would use 1001 butter and leave us with -999
                await request.query(`
                    UPDATE tblInventory
                    SET Quantity = @NewQuantity
                    WHERE EntityID = @EntityID
                `);
            }
        }
    } catch (error) {
        console.error('Error deducting from inventory for baking:', error);
        throw error;
    }
}



async function stockAfterBake(recipe, num) {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();
        const stockID = uuid.v4();
        request.input('ProductID', sql.NVarChar, recipe.ProductID);
        request.input('NewAmount', sql.Float, num * recipe.YieldAmount);
        request.input('StockID', sql.NVarChar, stockID);
        await request.query(`
            INSERT INTO tblStock (StockID, ProductID, CreateDateTime, ExpireDateTime, Amount)
            SELECT @StockID, @ProductID, GETDATE(), DATEADD(day, pr.ShelfLife, GETDATE()), @NewAmount
            FROM tblProduct pr
            WHERE pr.ProductID = @ProductID
        `);
        console.log('Stock added successfully.');
    } catch (error) {
        console.error('Error adding created products:', error);
        throw error;
    }
}

app.post('/api/startBaking', async (req, res) => {
    const { recipeID, num } = req.body;
    if (recipeID) {
        try {
            const recipe = await getRecipeFromDb(recipeID);

            if (!recipe) {
                return res.status(404).json({ error: 'Recipe not found' });
            }
            const quantities = await mulRecipe(recipeID, num);

            for (let ing of quantities) {
                if (await quantityCheck(ing)) {
                    throw new Error('One or more ingredient quantities are invalid.');
                }
            }

            for (let ing of quantities) {
                await deductInventory(ing);
            }

            await stockAfterBake(recipe, num);
            res.status(200).json({ message: 'Baking process completed successfully' });
        } catch (error) {
            console.error('Error using recipe: ', error);
            res.status(500).json({ error: 'Internal server error', message: error.message });
        }
    } else {
        res.status(400).json({ error: 'Recipe name is required' });
    }
});

//Takes in vendorID, vendorName, addressID, phoneNumberID, emailID, notes
//Updates the tblVendor
app.put('/api/vendor', async (req, res) => {
    //Gets the argruments
    await poolConnect;
    const request = pool.request();

    try {
        const { vendorID, vendorName, address, phoneNumber, email, notes } = req.body;

        if(!vendorID) {
            res.status(400).json({message : 'Missing VendorID'});
        }

        //Change Vendor Name
        if(vendorName) {
            const changeNameQuery = `UPDATE tblVendor
                                    SET VendorName = @vendorName
                                    WHERE VendorID = @vendorID`;
            request.input('vendorName', sql.NVarChar, vendorName);
            request.input('vendorID', sql.NVarChar, vendorID);
            const result = await request.query(changeNameQuery);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Vendor name failed to update or no vendor found'});
            }
        }

        //Change the Address
        if(address) {
            //Get Address ID
            request.input('vendorID', sql.NVarChar, vendorID);
            const queryAddressID = `SELECT AddressID
                                FROM tblVendorInfo
                                WHERE VendorID = @vendorID`;
            const addressID = request.query(queryAddressID);

            //In VendorInfo
            request.input('address', sql.NVarChar, address);
            request.input('addressID', sql.NVarChar, addressID);

            //In Address
            const changeAddressQuerytblUserAddress = `UPDATE tblUserAddress
                                                    SET Address = @address
                                                    WHERE AddressID = @addressID`;
            const result = await request.query(changeAddressQuerytblUserAddress);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Address failed to update or no address found'});
            }
        }

        //Change the Phone Number
        if(phoneNumber) {
            //Get Phone Number ID
            const queryPhoneNumberID = `SELECT PhoneNumberID
                                    FROM tblVendorInfo
                                    WHERE VendorID = @vendorID`;
            request.input('vendorID', sql.NVarChar, vendorID);
            const phoneNumberID = await request.query(queryPhoneNumberID);

            //Change Phone Number
            const updateArea = `UPDATE tblPhoneNumber
                                SET AreaCode = @area
                                WHERE PhoneNumberID = @phoneNumberID`;
            request.input('area', sql.NVarChar, phoneNumber.substring(0, 3));
            request.input('phoneNumberID', sql.NVarChar, phoneNumberID);
            await request.query(updateArea);

            const updateNumber = `UPDATE tblPhoneNumber
                                SET Number = @number
                                WHERE PhoneNumberID = @phoneNumberID`;
            request.input('number', sql.NVarChar, phoneNumber.substring(3, 9));
            const result = await request.query(updateNumber);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Phone number failed to update or no phone number found'});
            }
        }

        //Change the Email
        if(email) {
            //Get the Email
            request.input('vendorID', sql.NVarChar, vendorID);
            const emailQuery = `SELECT EmailID 
                                FROM tblVendorInfo 
                                WHERE VendorID = @vendorID`;
            const emailID = await request.query(emailQuery);

            //Change the Email
            const updateEmail = `UPDATE tblEmail
                                SET EmailAddress = @emailAddress
                                WHERE EmailID = @emailID`;
            request.input('emailID', sql.NVarChar, emailID);
            request.input('emailAddress', sql.NVarChar, email);
            const result = await request.query(updateEmail);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Email failed to update or no email found'});
            }
        }

        if(notes) {
            request.input('notes', sql.NVarChar, notes);
            request.input('vendorID', sql.NVarChar, vendorID);
            const updateNotes = `UPDATE tblVendorInfo
                                SET Notes = @notes
                                WHERE VendorID = @vendorID`;
            const result = await request.query(updateNotes);

            if (result.rowsAffected[0] === 0) {
                rowsUpdated = true;
            } else {
                return res.status(404).json({ message: 'Notes failed to update or no notes found'});
            }
        }

        if (rowsUpdated) {
            return res.status(404).json({ message: 'Vendor Updated Successfully'});
        } else {
            return res.status(400).json({ message: 'No Updates Were Made'});
        }
    } catch (error) {
        console.error('Error updating vendor:', error);
        return res.status(500).json({ message: 'Error Updating Vendor: ', error});
    }
});

//DELETE for Vendor
app.delete('/api/vendor', async (req, res) => {
    try {
        const { vendorID } = req.body;

        //Removes
        await removeVendor(vendorID);

        //Destroys
        res.status(200).json({ message: 'Vendor Successfully Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

//VendorNames GET
app.get('/api/vendorNames', async (req, res) => {
    try {
        const vendorNames = await getVendorNames();

        if (vendorNames) {
            if (vendorNames.length > 0) {
                res.status(200).json(vendorNames);
            } else {
                res.status(404).send('No vendors found');
            }
        }
    } catch (error) {
        res.status(500).send('Error retrieving ingredients');
        res.status(500).json({ error: 'Error retrieving ingredients', message: error.message });
    }
});

app.get('/api/empAvailability', async (req, res) => {
    const { userName, weekID, dayID } = req.query.name;
    if (!userName || !weekID || !dayID) {
        return res.status(400).json({ error: 'Invalid request', message: 'The employees name is required'});
    }
    try {
        const request = pool.request();
        request.input('UserID', sql.NVarChar, userName);
        request.input('WeekID', sql.NVarChar, weekID);
        request.input('DayID', sql.NVarChar, dayID);
        const result = await request.query('SELECT * FROM tblAvailability WHERE userID = @UserID, weekID = @WeekID, dayID = @DayID');
        const availability = result.recordset[0];

        if (availability) {
            res.status(200).json(availability);   //Sends as a JSON response
        } else {
            res.status(404).send('Availability not found');
        }
    } catch (error) {
        res.status(500).send('Error fetching availability');
    }
})


//just needed an update for the employee availability
//didnt need a post since we are 'hardcoding' our week into the database
//The start day is 9-30-2024
//cURL command to test this is: 
    //curl -X PUT http://localhost:3030/api/empAvailability -H "Content-Type: application/json" -d "{\"sessionID\": \"02ce9aec-5e93-415b-b7eb-ac553a5c0036\", \"mondayShiftOne\": 1, \"mondayShiftTwo\": 1, \"tuesdayShiftOne\": 1, \"tuesdayShiftTwo\": 1, \"wednesdayShiftOne\": 1, \"wednesdayShiftTwo\": 1, \"thursdayShiftOne\": 1, \"thursdayShiftTwo\": 1, \"fridayShiftOne\": 1, \"fridayShiftTwo\": 1, \"saturdayShiftOne\": 1, \"saturdayShiftTwo\": 1, \"sundayShiftOne\": 1, \"sundayShiftTwo\": 1}" 
app.put('/api/empAvailability', async (req, res) => {
    await poolConnect; 

    try {
        const { sessionID, mondayShiftOne, mondayShiftTwo, tuesdayShiftOne, tuesdayShiftTwo,
            wednesdayShiftOne, wednesdayShiftTwo, thursdayShiftOne, thursdayShiftTwo, fridayShiftOne,
            fridayShiftTwo, saturdayShiftOne, saturdayShiftTwo, sundayShiftOne, sundayShiftTwo } = req.body;

        const user = await getUserBySession(sessionID);

        if (!user) {
            return res.status(401).send('User Unauthorized');
        }
        const userID = user.UserID;

        if (!userID) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const Monday = new Date('2024-09-30T00:00:00');

        const dayArray = [
            { dayName: 'Monday', shiftOne: mondayShiftOne, shiftTwo: mondayShiftTwo },
            { dayName: 'Tuesday', shiftOne: tuesdayShiftOne, shiftTwo: tuesdayShiftTwo },
            { dayName: 'Wednesday', shiftOne: wednesdayShiftOne, shiftTwo: wednesdayShiftTwo },
            { dayName: 'Thursday', shiftOne: thursdayShiftOne, shiftTwo: thursdayShiftTwo },
            { dayName: 'Friday', shiftOne: fridayShiftOne, shiftTwo: fridayShiftTwo },
            { dayName: 'Saturday', shiftOne: saturdayShiftOne, shiftTwo: saturdayShiftTwo },
            { dayName: 'Sunday', shiftOne: sundayShiftOne, shiftTwo: sundayShiftTwo }
        ];

        for (let i = 0; i < dayArray.length; i++) {
            const currentDay = new Date(Monday);
            currentDay.setDate(Monday.getDate() + i);

            const yyyy = currentDay.getFullYear();
            const MM = String(currentDay.getMonth() + 1).padStart(2, '0');
            const dd = String(currentDay.getDate()).padStart(2, '0');
            const formattedDate = `${yyyy}${MM}${dd}`;

            const request = pool.request();
            request.input('date', sql.NVarChar, formattedDate);
            request.input('userID', sql.NVarChar, userID);

            const dayQuery = 'SELECT DayID FROM tblDay WHERE Date = @date';
            const dayResult = await request.query(dayQuery);
            if (dayResult.recordset.length === 0) {
                continue; 
            }

            const dayID = dayResult.recordset[0].DayID;

            request.input('dayID', sql.NVarChar, dayID);
            request.input('shiftOne', sql.Bit, dayArray[i].shiftOne);
            request.input('shiftTwo', sql.Bit, dayArray[i].shiftTwo);

            const updateQuery = `
                UPDATE tblAvailability
                SET shiftOne = @shiftOne, shiftTwo = @shiftTwo
                WHERE userID = @userID AND dayID = @dayID`;

            const updateResult = await request.query(updateQuery);
            console.log('Day updated');
            if (updateResult.rowsAffected[0] === 0) {
                console.log(`No entry found to update for DayID ${dayID}`);
                return res.status(404).json({ message: 'No entry found to update' });
            }
        }

        console.log('Entry updated successfully');
        return res.status(200).json({ message: 'Entry updated successfully' });

    } catch (error) {
        console.error('Error updating entry:', error);
        return res.status(500).json({ message: 'Error updating entry', error });
    }
});


app.post('/api/reOrderIngredient', async (req, res) => {
    const { ingredientID } = req.body;

    if (!ingredientID) {
        return res.status(400).json({ error: 'ingredientID is required' });
    }

    try {

        await poolConnect;

        const request = pool.request();
        let result = await request
            .input('ingredientID', sql.NVarChar, ingredientID)
            .query(`
                SELECT * FROM vwReorder
                WHERE ingredientID = @ingredientID;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'No data found for the given ingredientID' });
        }

        let row = result.recordset[0];

        const poNumber = `PO${uuid.v4()}`;

        let insertRequest = pool.request();
        await insertRequest
            .input('PONumber', sql.NVarChar(50), poNumber)
            .input('VendorID', sql.NVarChar, row.vendorID)
            .input('IngredientID', sql.NVarChar, row.ingredientID)
            .input('Quantity', sql.Decimal(10, 2), row.ReorderAmount)
            .input('Price', sql.Decimal(18, 2), row.result)
            .input('CreateDateTime', sql.DateTime, new Date())
            .input('FulfillDateTime', sql.DateTime, null)
            .query(`
                INSERT INTO tblOrder (PONumber, VendorID, IngredientID, Quantity, Price, CreateDateTime, FulfillDateTime)
                VALUES (@PONumber, @VendorID, @IngredientID, @Quantity, @Price, @CreateDateTime, @FulfillDateTime);
            `);

        return res.status(201).json({ poNumber: poNumber, message: 'Order successfully created' });

    } catch (error) {
        console.error('Error processing reorder:', error);
        return res.status(500).json({ error: 'An error occurred while processing the request', message: error.message });
    }
});


app.post('/api/fulfillDateTime', async (req, res) => {
    const { PONumber } = req.body;

    if (!PONumber) {
        return res.status(400).json({ error: 'PONumber is required' });
    }

    try {
        await poolConnect;

        const fulfillDate = new Date();
        let request = pool.request();

        const updateResult = await request
            .input('PONumber', sql.NVarChar(50), PONumber)
            .input('FulfillDateTime', sql.DateTime, fulfillDate)
            .query(`
                UPDATE tblOrder 
                SET FulfillDateTime = @FulfillDateTime 
                WHERE PONumber = @PONumber
            `);

        if (updateResult.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'No order found with the given PONumber' });
        }

        request = pool.request();
        const orderResult = await request
            .input('PONumber', sql.NVarChar(50), PONumber)
            .query(`
                SELECT IngredientID, Quantity, Price 
                FROM tblOrder 
                WHERE PONumber = @PONumber
            `);

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Order details not found for the given PONumber' });
        }

        const orderData = orderResult.recordset[0];
        const ingredientID = orderData.IngredientID;
        const quantity = orderData.Quantity;
        const cost = orderData.Price;

        request = pool.request();
        const nameRequest = await request
            .input('IngredientID', sql.NVarChar(50), ingredientID)
            .query(`
                SELECT Name 
                FROM tblIngredient 
                WHERE IngredientID = @IngredientID
            `);

        if (nameRequest.recordset.length === 0) {
            return res.status(404).json({ error: 'Ingredient details not found for the given IngredientID' });
        }

        const ingredientName = nameRequest.recordset[0].Name;

        const entityID = require('uuid').v4();
        const expireDateTime = new Date(fulfillDate);
        expireDateTime.setDate(fulfillDate.getDate() + 7);

        // Insert new inventory record into tblInventory
        const insertInventoryRequest = pool.request();
        await insertInventoryRequest
            .input('EntityID', sql.UniqueIdentifier, entityID)
            .input('IngredientID', sql.NVarChar, ingredientID)
            .input('Quantity', sql.Decimal(10, 2), quantity)
            .input('UserID', sql.Int, 1) //Just made 1 for now since that's what we've been using
            .input('Notes', sql.NVarChar(255), `new order of ingredient ${ingredientName}`)
            .input('Cost', sql.Decimal(18, 2), cost)
            .input('CreateDateTime', sql.DateTime, fulfillDate) //using the fulfull date at the start date
            .input('ExpireDateTime', sql.DateTime, expireDateTime)
            .input('PONumber', sql.NVarChar(50), PONumber)
            .query(`
                INSERT INTO tblInventory (EntityID, IngredientID, Quantity, UserID, Notes, Cost, CreateDateTime, ExpireDateTime, PONumber)
                VALUES (@EntityID, @IngredientID, @Quantity, @UserID, @Notes, @Cost, @CreateDateTime, @ExpireDateTime, @PONumber)
            `);

        return res.status(200).json({ poNumber: PONumber, message: 'Order successfully fulfilled and inventory updated' });

    } catch (error) {
        console.error('Error processing fulfillment:', error);
        return res.status(500).json({ error: 'An error occurred while processing the request', message: error.message });
    }
});


async function getReorderIngredients(){
    try {
        const request = pool.request();
        const result = await request.query(`
            SELECT iqc.Name, iqc.TotalQuantityInInventory, iqc.Measurement
            FROM vwIngredientQuantityCheck iqc
            WHERE iqc.TotalQuantityInInventory <= iqc.ReorderAmount
            ORDER BY iqc.TotalQuantityInInventory
        `); //Get info for ingredients where quantity is less than ReorderAmount
        return result.recordset;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// GET ingredients where the Amount < ReorderAmount
app.get('/api/getReorderIngredients', async (req, res) => {
    try {
        const lowIngredients = await getReorderIngredients();
        if (!lowIngredients){
            res.status(404).send("No ingredients need to be reordered!");
        }
        res.json(lowIngredients);
    } catch(error) {
        res.status(500).send('Error retrieving low ingredients');
        res.status(500).json({ error: 'Error retrieving low ingredients', message: error.message });
    }
});

app.post('/api/addAvailibility', async (req, res) => {
    try {
        await poolConnect;

        const weekResult = await pool.request().query(`
            SELECT weekID, dayID FROM tblDay
            WHERE weekID = (
                SELECT TOP 1 weekID FROM tblWeek
                ORDER BY ABS(DATEDIFF(DAY, StartDate, GETDATE()))
            )
            ORDER BY Date
        `);

        if (weekResult.recordset.length === 0) {
            return res.status(404).json({ error: 'No weekID found for today\'s date' });
        }

        const weekID = weekResult.recordset[0].weekID;
        const userID = '1'; 
        for (const day of weekResult.recordset) {
            const dayID = day.dayID;
            
            const request = pool.request();
            await request
                .input('userID', sql.NVarChar, userID)
                .input('weekID', sql.NVarChar, weekID)
                .input('dayID', sql.NVarChar, dayID)
                .query(`
                    INSERT INTO tblAvailability (userID, weekID, dayID, shiftOne, shiftTwo) 
                    VALUES (@userID, @weekID, @dayID, @shiftOne, @shiftTwo)
                `);
        }   

        res.status(200).json({ message: 'Availability recorded successfully for all days' });
    } catch (error) {
        console.error('Error recording availability:', error);
        res.status(500).send('Error recording availability');
    }
});

async function getExpiringIngredients(){  // just selecting the entire view but ordering it by DaysRemaining
    try{
        const request = pool.request();
        const result = await request.query(`
            SELECT PONumber, Name, CASE WHEN DaysRemaining < 0 THEN 'Expired' END AS DaysRemaining
            FROM vwInventoryExpireSoon
            ORDER BY CASE
                WHEN ISNUMERIC(DaysRemaining) = 1 THEN 1
                ELSE 0
            END, DaysRemaining
        `);
        return result.recordset;
    } catch (error) {
        console.error('Error retrieving expiring ingredients:', error);
        throw error;
    }
}

// GET entities in inventory that are expiring in 3 days or less
app.get('/api/getExpiringIngredients', async (req, res) => {
    try{
        const expiringIngredients = await getExpiringIngredients();
        if (!expiringIngredients){
            res.status(404).send("No ingredients are expiring!");
        }
        res.json(expiringIngredients);
    } catch(error) {
        res.status(500).send('Error retrieving expiring ingredients');
        res.status(500).json({ error: 'Error retrieving expiring ingredients', message: error.message });
    }
});



// const recipes = [
//     {
//         Name: 'Blue Cake',
//         Notes: 'A rich and moist chocolate cake.',
//         ProductCategoryID: '1',
//         YieldAmount: 1,
//         PrepTime: '00:30:00',
//         BakeTime: '00:25:00'
//     }
// ];

// const equipmentData = [
//     { Name: 'Sifter', Quantity: 1 },
//     { Name: 'Medium mixing bowl', Quantity: 2 },
//     { Name: 'Large baking sheet', Quantity: 1 }
// ];

// const ingredientData = [
//     { Name: 'Flour', Quantity: 270 },
//     { Name: 'Milk', Quantity: 90 },
//     { Name: 'Orange juice', Quantity: 112 },
//     { Name: 'Vanilla extract', Quantity: 2 },
//     { Name: 'Baking soda', Quantity: 40 },
//     { Name: 'Ground cinnamon', Quantity: 2.25 },
//     { Name: 'Ground ginger', Quantity: 0.5 },
//     { Name: 'Ground nutmeg', Quantity: 170 }
// ];

// const instructionData = [
//     { Instruction: "Preheat oven to 180°C (350°F) and grease the cake tins." },
//     { Instruction: "Sift together flour, cornstarch, baking powder, and salt." },
//     { Instruction: "In a large bowl, add butter, vegetable oil, and sugar." },
//     { Instruction: "Add eggs one at a time, mixing well between each addition." },
//     { Instruction: "Add milk, orange juice, and vanilla extract." },
//     { Instruction: "Add the pre-sifted dry ingredients to the wet ingredients." },
//     { Instruction: "Distribute the batter evenly into the two prepared cake tins." },
//     { Instruction: "Bake for 30-35 minutes or until a toothpick inserted comes out clean." },
//     { Instruction: "Let the cake cool in the tins for 15-20 minutes before transferring to a wire rack." }
// ];

app.post('/api/insertFullRecipe', async (req, res) => {
      // Get the arrays from the frontend
      const { recipes, equipmentData, ingredientData, instructionData } = req.body;

      // Validate the incoming data
      if (!recipes || !equipmentData || !ingredientData || !instructionData) {
          return res.status(400).json({ error: 'Missing required recipe, equipment, ingredient, or instruction data.' });
      }
  
      try {
          await poolConnect; // Ensure database connection

        for (let recipe of recipes) {
            const { Name, Notes, YieldAmount, ProductCategoryID, PrepTime, BakeTime } = recipe;

            const recipeUUID = uuid.v4();

            const productRequest = pool.request();
            await productRequest
                .input('ProductID', sql.NVarChar(50), recipeUUID)
                .input('ProductCategoryID', sql.NVarChar(50), ProductCategoryID) 
                .input('Name', sql.NVarChar(255), Name)
                .input('Description', sql.NVarChar(1000), Notes)
                .query(`
                    INSERT INTO tblProduct (ProductID, ProductCategoryID, Name, Description)
                    VALUES (@ProductID, @ProductCategoryID, @Name, @Description);
                `);

            const recipeRequest = pool.request();
            await recipeRequest
                .input('RecipeID', sql.NVarChar(50), recipeUUID)
                .input('Name', sql.NVarChar(255), Name)
                .input('Notes', sql.NVarChar(1000), Notes)
                .input('YieldAmount', sql.Int, YieldAmount)
                .input('ProductID', sql.NVarChar(50), recipeUUID) 
                .input('PrepTime', sql.NVarChar(8), PrepTime)
                .input('BakeTime', sql.NVarChar(8), BakeTime)
                .query(`
                    INSERT INTO tblRecipe (RecipeID, Name, Notes, YieldAmount, ProductID, PrepTime, BakeTime)
                    VALUES (@RecipeID, @Name, @Notes, @YieldAmount, @ProductID, CAST(@PrepTime AS TIME), CAST(@BakeTime AS TIME));
                `);

            for (let ingredient of ingredientData) {
                const { Name: IngredientName, Quantity } = ingredient;

                const ingredientRequest = pool.request();
                const ingredientResult = await ingredientRequest
                    .input('Name', sql.NVarChar(255), IngredientName)
                    .query(`SELECT IngredientID FROM tblIngredient WHERE Name = @Name;`);

                if (ingredientResult.recordset.length === 0) {
                    return res.status(404).json({ error: `Ingredient ${IngredientName} not found in the database` });
                }

                const ingredientID = ingredientResult.recordset[0].IngredientID;

                const insertIngredientRequest = pool.request();
                await insertIngredientRequest
                    .input('RecipeID', sql.NVarChar(50), recipeUUID)
                    .input('IngredientID', sql.NVarChar(50), ingredientID)
                    .input('Quantity', sql.Decimal(10, 2), Quantity)
                    .query(`
                        INSERT INTO tblRecipeIngredient (RecipeID, IngredientID, Quantity)
                        VALUES (@RecipeID, @IngredientID, @Quantity);
                    `);
            }

            for (let equipment of equipmentData) {
                const { Name: EquipmentName, Quantity } = equipment;

                const equipmentRequest = pool.request();
                const equipmentResult = await equipmentRequest
                    .input('Name', sql.NVarChar(255), EquipmentName)
                    .query(`SELECT EquipmentID FROM tblEquipment WHERE Name = @Name;`);

                if (equipmentResult.recordset.length === 0) {
                    return res.status(404).json({ error: `Equipment ${EquipmentName} not found in the database` });
                }

                const equipmentID = equipmentResult.recordset[0].EquipmentID;

                const insertEquipmentRequest = pool.request();
                await insertEquipmentRequest
                    .input('RecipeID', sql.NVarChar(50), recipeUUID)
                    .input('EquipmentID', sql.NVarChar(50), equipmentID)
                    .input('Quantity', sql.Decimal(10, 2), Quantity)
                    .query(`
                        INSERT INTO tblRecipeEquipment (RecipeID, EquipmentID, Quantity)
                        VALUES (@RecipeID, @EquipmentID, @Quantity);
                    `);
            }

            let stepID = 1;
            for (let instruction of instructionData) {
                const instructionRequest = pool.request();
                await instructionRequest
                    .input('RecipeID', sql.NVarChar(50), recipeUUID)
                    .input('StepID', sql.Int, stepID)
                    .input('Instruction', sql.NVarChar(1000), instruction.Instruction)
                    .query(`
                        INSERT INTO tblRecipeInstruction (RecipeID, StepID, Instruction)
                        VALUES (@RecipeID, @StepID, @Instruction);
                    `);

                stepID++; 
            }
        }

        return res.status(201).json({ message: 'Recipe, ingredients, equipment, and instructions inserted successfully' });

    } catch (error) {
        console.error('Error inserting recipe data:', error);
        return res.status(500).json({ error: 'An error occurred while processing the request', message: error.message });
    }
});



// Initialize the database tables and start the server
createTables()
    .then(() => {
        const port = process.env.PORT || 3030;
        app.listen(port, () => {
            console.log(`Listening on port ${port}...`);
        });
    })
    .catch(err => {
        process.exit(1);
    });