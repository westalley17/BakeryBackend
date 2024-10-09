const { pool, poolConnect } = require('./databaseConnection'); // Adjust the import path as needed


async function createTables() {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();

        //Create tblUser
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblUser')
                CREATE TABLE tblUser (
                    UserID NVARCHAR(50) PRIMARY KEY,
                    FirstName NVARCHAR(64) NOT NULL,
                    LastName NVARCHAR(64) NOT NULL,
                    Username NVARCHAR(30) NOT NULL,
                    Password NVARCHAR(250) NOT NULL,
                    UserType BIT NOT NULL,
                    UNIQUE (Username)
                )
            `);

        //Create tblAddressType
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblAddressType')
                CREATE TABLE tblAddressType (
                    TypeID NVARCHAR(50) PRIMARY KEY,
                    Description NVARCHAR(50),
                    Active BIT
                )
            `);

        //Create tblEmailType
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblEmailType')
                CREATE TABLE tblEmailType (
                    TypeID NVARCHAR(50) PRIMARY KEY,
                    Description NVARCHAR(50),
                    Active BIT
                )
            `);

        //Create tblPayType
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPayType')
                CREATE TABLE tblPayType (
                    TypeID NVARCHAR(50) PRIMARY KEY,
                    Description NVARCHAR(50)
                )
            `);

        //Create tblPhoneNumberTypes
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPhoneNumberTypes')
                CREATE TABLE tblPhoneNumberTypes (
                    TypeID NVARCHAR(50) PRIMARY KEY,
                    Description NVARCHAR(50),
                    Active BIT
                )
            `);

        //Create tblRaceType
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRaceType')
                CREATE TABLE tblRaceType (
                    TypeID NVARCHAR(50) PRIMARY KEY,
                    Description NVARCHAR(50)
                )
            `);

        //Create tblState
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblState')
                CREATE TABLE tblState (
                    StateID NVARCHAR(50) PRIMARY KEY,
                    Description NVARCHAR(50)
                )
            `);

        //Create tblBiWeek
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblBiWeek')
                CREATE TABLE tblBiWeek (
                    BiWeekID NVARCHAR(50) PRIMARY KEY,
                    BiWeekNum INT,
                    StartDate DATE
                )
            `);

        //Create tblWeek
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblWeek')
                CREATE TABLE tblWeek (
                    WeekID NVARCHAR(50) PRIMARY KEY,
                    BiWeekID NVARCHAR(50),
                    WeekNum INT,
                    StartDate DATE,
                    FOREIGN KEY (BiWeekID) REFERENCES tblBiWeek(BiWeekID) ON DELETE CASCADE
                )
            `);

        //Create tblTimeType
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblTimeType')
                CREATE TABLE tblTimeType (
                    TypeID NVARCHAR(50) PRIMARY KEY,
                    Description NVARCHAR(50)
                )
            `);

        //Create tblAge
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblAge')
                CREATE TABLE tblAge (
                    AgeID NVARCHAR(50) PRIMARY KEY,
                    Age NVARCHAR(3) NOT NULL,
                    UserID NVARCHAR(50),
                    UNIQUE (UserID),
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE
                )
            `);

        //Create tblDOB
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblDOB')
                CREATE TABLE tblDOB (
                    DobID NVARCHAR(50) PRIMARY KEY,
                    BirthDate DATE NOT NULL,
                    UserID NVARCHAR(50),
                    UNIQUE (UserID),
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE
                )
            `);

        //Create tblEmail
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblEmail')
                CREATE TABLE tblEmail (
                    EmailID NVARCHAR(50) PRIMARY KEY,
                    EmailAddress NVARCHAR(320),
                    UserID NVARCHAR(50),
                    TypeID NVARCHAR(50),
                    Valid BIT,
                    UserType BIT,
                    vendorID NVARCHAR(50),
                    UNIQUE (EmailAddress),
                    FOREIGN KEY (TypeID) REFERENCES tblEmailType(TypeID),
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE,
                    FOREIGN KEY (vendorID)REFERENCES tblVendor(VendorID) ON DELETE CASCADE
                )
            `);

        //Create tblEmployeeTime
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblEmployeeTime')
                CREATE TABLE tblEmployeeTime (
                    EmpTypeID NVARCHAR(50) PRIMARY KEY,
                    TypeID NVARCHAR(50),
                    UserID NVARCHAR(50),
                    FOREIGN KEY (TypeID) REFERENCES tblTimeType(TypeID),
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE
                )
            `);

        //Create tblGender
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblGender')
                CREATE TABLE tblGender (
                    GenderID NVARCHAR(50) PRIMARY KEY,
                    GenderType BIT NOT NULL,
                    UserID NVARCHAR(50),
                    UNIQUE (UserID),
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE
                )
            `);

        //Create tblHireDate
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblHireDate')
                CREATE TABLE tblHireDate (
                    HireID NVARCHAR(50) PRIMARY KEY,
                    HireDate DATE NOT NULL,
                    UserID NVARCHAR(50),
                    UNIQUE (UserID),
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE
                )
            `);

        //Create tblDay
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblDay')
                CREATE TABLE tblDay (
                    DayID NVARCHAR(50) PRIMARY KEY,
                    WeekID NVARCHAR(50),
                    DayNum INT,
                    Date DATE,
                    FOREIGN KEY (WeekID) REFERENCES tblWeek(WeekID) ON DELETE CASCADE
                )
            `);

        //Create tblHourly
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblHourly')
                CREATE TABLE tblHourly (
                    TypeID NVARCHAR(50),
                    HourRate DECIMAL(5,2),
                    FOREIGN KEY (TypeID) REFERENCES tblPayType(TypeID) ON DELETE CASCADE
                )
            `);

        //Create tblHourlyHoliday
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblHourlyHoliday')
                CREATE TABLE tblHourlyHoliday (
                    TypeID NVARCHAR(50),
                    HourRateHoliday DECIMAL(5,2),
                    FOREIGN KEY (TypeID) REFERENCES tblPayType(TypeID) ON DELETE CASCADE
                )
            `);

        // Create tblHourlyOvertime
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblHourlyOvertime')
                CREATE TABLE tblHourlyOvertime (
                    TypeID NVARCHAR(50),
                    HourRateOT DECIMAL(5,2),
                    FOREIGN KEY (TypeID) REFERENCES tblPayType(TypeID) ON DELETE CASCADE
                )
            `);

        // Create tblHoursWorkedDay
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblHoursWorkedDay')
                CREATE TABLE tblHoursWorkedDay (
                    hoursID nvarchar(50) NOT NULL,
                    userID nvarchar(50) DEFAULT NULL,
                    dayID nvarchar(50) DEFAULT NULL,
                    normalHours decimal(5,2) DEFAULT NULL,
                    overtimeHours decimal(5,2) DEFAULT NULL,
                    holidayHours decimal(5,2) DEFAULT NULL,
                    PRIMARY KEY (hoursID),
                    FOREIGN KEY (userID) REFERENCES tbluser (userID) ON DELETE CASCADE,
                    FOREIGN KEY (dayID) REFERENCES tblday (dayID) ON DELETE CASCADE
                ) 
            `);

        // Create tblPay
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPay')
                CREATE TABLE tblPay (
                    PayID NVARCHAR(50) PRIMARY KEY,
                    UserID NVARCHAR(50),
                    TypeID NVARCHAR(50),
                    UserType BIT,
                    UNIQUE (UserID),
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE,
                    FOREIGN KEY (TypeID) REFERENCES tblPayType(TypeID) ON DELETE CASCADE
                )
            `);

        // Create tblPhoneNumber
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPhoneNumber')
                CREATE TABLE tblPhoneNumber (
                    PhoneNumberID NVARCHAR(50) PRIMARY KEY,
                    AreaCode NVARCHAR(3),
                    Number NVARCHAR(7),
                    TypeID NVARCHAR(50),
                    Valid BIT,
                    UserID NVARCHAR(50),
                    UserType BIT,
                    vendorID NVARCHAR(50),
                    FOREIGN KEY (TypeID) REFERENCES tblPhoneNumberTypes(TypeID) ON DELETE CASCADE,
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE,
                    FOREIGN KEY (vendorID)REFERENCES tblVendor(VendorID) ON DELETE CASCADE

                )
            `);

        // Create tblRace
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRace')
                CREATE TABLE tblRace (
                    RaceID NVARCHAR(50) PRIMARY KEY,
                    TypeID NVARCHAR(50),
                    UserID NVARCHAR(50),
                    FOREIGN KEY (TypeID) REFERENCES tblRaceType(TypeID),
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE
                )
            `);

        // Create tblSalary
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblSalary')
                CREATE TABLE tblSalary (
                    TypeID NVARCHAR(50),
                    SalaryRate DECIMAL(10,2),
                    FOREIGN KEY (TypeID) REFERENCES tblPayType(TypeID) ON DELETE CASCADE
                )
            `);

        // Create tblSession
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblSession')
                CREATE TABLE tblSession (
                    SessionID NVARCHAR(50) PRIMARY KEY,
                    UserID NVARCHAR(50) NOT NULL,
                    UserType BIT NOT NULL,
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE
                )
            `);

        // Create tblShift
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblShift')
                CREATE TABLE tblShift (
                    ShiftID NVARCHAR(50) PRIMARY KEY,
                    DayID NVARCHAR(50),
                    ShiftDescription NVARCHAR(100) NOT NULL,
                    Available BIT NOT NULL,
                    FOREIGN KEY (DayID) REFERENCES tblDay(DayID) ON DELETE CASCADE
                )
            `);

        // Create tblSSN
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblSSN')
                CREATE TABLE tblSSN (
                    SSNID NVARCHAR(50) PRIMARY KEY,
                    SSN NVARCHAR(9) NOT NULL,
                    UserID NVARCHAR(50),
                    UNIQUE (SSN),
                    UNIQUE (UserID),
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE
                )
            `);

        // Create tblUserAddress
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblUserAddress')
                CREATE TABLE tblUserAddress (
                    AddressID NVARCHAR(50) PRIMARY KEY,
                    Address NVARCHAR(320),
                    UserID NVARCHAR(50),
                    TypeID NVARCHAR(50),
                    StateID NVARCHAR(50),
                    Valid BIT,
                    UserType BIT,
                    vendorID NVARCHAR(50),
                    FOREIGN KEY (TypeID) REFERENCES tblAddressType(TypeID),
                    FOREIGN KEY (StateID) REFERENCES tblState(StateID),
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID) ON DELETE CASCADE,
                    FOREIGN KEY (vendorID)REFERENCES tblVendor(VendorID) ON DELETE CASCADE
                )
            `);

        // Create tblBiWeekDayConversion
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblBiWeekDayConversion')
                CREATE TABLE tblBiWeekDayConversion (
                    DayID NVARCHAR(50) PRIMARY KEY,
                    BiWeekNum INT,
                    WeekNum INT,
                    DayNum INT
                )
            `);

        // Create tblIngredientCategory
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblIngredientCategory')
                CREATE TABLE tblIngredientCategory (
                    IngredientCategoryID NVARCHAR(50) PRIMARY KEY,
                    Name NVARCHAR(50) NOT NULL,
                    Description NVARCHAR(50) NOT NULL
                )
            `);

        // Create tblIngredient
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblIngredient')
                CREATE TABLE tblIngredient (
                    IngredientID NVARCHAR(50) PRIMARY KEY,
                    Name NVARCHAR(50) NOT NULL,
                    Description NVARCHAR(50) NOT NULL,
                    IngredientCategoryID NVARCHAR(50) NOT NULL,
                    Measurement NVARCHAR(50) NOT NULL,
                    MaxAmount DECIMAL(10,2) NOT NULL,
                    ReorderAmount DECIMAL(10,2) NOT NULL,
                    MinAmount DECIMAL(10,2) NOT NULL,
                    Allergen BIT NOT NULL,
                    FOREIGN KEY (IngredientCategoryID) REFERENCES tblIngredientCategory(IngredientCategoryID) ON DELETE CASCADE
                )
            `);

        // Create tblInventory
        await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblInventory')
                CREATE TABLE tblInventory (
                    EntityID NVARCHAR(50) PRIMARY KEY,
                    IngredientID NVARCHAR(50) NOT NULL,
                    Quantity DECIMAL(10,2) NOT NULL,
                    UserID NVARCHAR(50) NOT NULL,
                    Notes NVARCHAR(50),
                    Cost DECIMAL(10,2) NOT NULL,
                    CreateDateTime DATETIME NOT NULL,
                    ExpireDateTime DATETIME NOT NULL,
                    PONumber NVARCHAR(50),
                    FOREIGN KEY (IngredientID) REFERENCES tblIngredient(IngredientID) ON DELETE CASCADE,
                    FOREIGN KEY (UserID) REFERENCES tblUser(UserID),
                    FOREIGN KEY (PONumber) REFERENCES tblOrder(PONumber) ON DELETE CASCADE
                )
            `);


        // Create tblProductCategory
        await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblProductCategory')
			CREATE TABLE tblProductCategory (
				ProductCategoryID NVARCHAR(50) PRIMARY KEY,
				Name NVARCHAR(50) NOT NULL,
				Description NVARCHAR(50) NOT NULL
			)
		`);

        // Create tblProduct
        await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblProduct')
			CREATE TABLE tblProduct (
				ProductID NVARCHAR(50) PRIMARY KEY,
				Name NVARCHAR(50) NOT NULL,
				Description NVARCHAR(50) NOT NULL,
				ProductCategoryID NVARCHAR(50) NOT NULL,
				FOREIGN KEY (ProductCategoryID) REFERENCES tblProductCategory(ProductCategoryID) ON DELETE CASCADE
			)
		`);

        // Create tblStock
        await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblStock')
			CREATE TABLE tblStock (
				StockID NVARCHAR(50) PRIMARY KEY,
				ProductID NVARCHAR(50) NOT NULL,
				CreateDateTime DATETIME NOT NULL,
				ExpireDateTime DATETIME NOT NULL,
				Amount DECIMAL(10,2),
				FOREIGN KEY (ProductID) REFERENCES tblProduct(ProductID)
			)
		`);

        // Create tblRecipe
        await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRecipe')
			CREATE TABLE tblRecipe (
				RecipeID NVARCHAR(50) PRIMARY KEY,
				Name NVARCHAR(50) NOT NULL,
				Notes NVARCHAR(50),
				YieldAmount INT NOT NULL,
				ProductID NVARCHAR(50) NOT NULL,
				PrepTime TIME NOT NULL,
				BakeTime TIME NOT NULL,
				FOREIGN KEY (ProductID) REFERENCES tblProduct(ProductID) ON DELETE CASCADE
			)
		`);

        // Create tblStorefront
        await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblStorefront')
			CREATE TABLE tblStorefront (
				StorefrontID NVARCHAR(50) PRIMARY KEY,
				CurrentAmount INT NOT NULL,
				RestockAmount INT NOT NULL,
				MinAmount INT NOT NULL
			)
		`);

        // Create tblEquipment
        await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblEquipment')
			CREATE TABLE tblEquipment (
				EquipmentID NVARCHAR(50) PRIMARY KEY,
				Name NVARCHAR(50) NOT NULL,
				Description NVARCHAR(50) NOT NULL,
				Notes NVARCHAR(50) NOT NULL
			)
		`);

        // Create tblKitchenEquipment
        await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblKitchenEquipment')
			CREATE TABLE tblKitchenEquipment (
				KitchenEquipmentID NVARCHAR(50) PRIMARY KEY,
				EquipmentID NVARCHAR(50) NOT NULL,
				Name NVARCHAR(50) NOT NULL,
				Status NVARCHAR(50) NOT NULL,
				SerialNumber NVARCHAR(50) NOT NULL,
				Notes NVARCHAR(50),
				FOREIGN KEY (EquipmentID) REFERENCES tblEquipment(EquipmentID)
			)
		`);

        // Create tblRecipeIngredient
        await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRecipeIngredient')
			CREATE TABLE tblRecipeIngredient (
				RecipeID NVARCHAR(50) NOT NULL,
				IngredientID NVARCHAR(50) NOT NULL,
				Quantity DECIMAL(10,2) NOT NULL,
				PRIMARY KEY (RecipeID, IngredientID),
				FOREIGN KEY (RecipeID) REFERENCES tblRecipe(RecipeID),
				FOREIGN KEY (IngredientID) REFERENCES tblIngredient(IngredientID)
			)
		`);

        // Create tblRecipeEquipment
        await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRecipeEquipment')
			CREATE TABLE tblRecipeEquipment (
				RecipeID NVARCHAR(50) NOT NULL,
				EquipmentID NVARCHAR(50) NOT NULL,
				Quantity DECIMAL(6,2) NOT NULL,
				PRIMARY KEY (RecipeID, EquipmentID),
				FOREIGN KEY (RecipeID) REFERENCES tblRecipe(RecipeID),
				FOREIGN KEY (EquipmentID) REFERENCES tblEquipment(EquipmentID)
			)
		`);

        // Create tblRecipeInstruction
        await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRecipeInstruction')
			CREATE TABLE tblRecipeInstruction (
				RecipeID NVARCHAR(50) NOT NULL,
				StepID INT NOT NULL,
				Instruction NVARCHAR(MAX),
				PRIMARY KEY (RecipeID, StepID),
				FOREIGN KEY (RecipeID) REFERENCES tblRecipe(RecipeID)
			)	
		`);

        // Create tblLog
        await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblLog')
			CREATE TABLE tblLog (
                logID NVARCHAR(50) PRIMARY KEY,  
                userID NVARCHAR(50) NOT NULL,        
                dayID NVARCHAR(50) NOT NULL,     
                clockInTime DATETIME NOT NULL,     
                clockOutTime DATETIME NOT NULL,      
                isHoliday BIT NOT NULL,              
                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE,
                FOREIGN KEY (dayID) REFERENCES tblday(dayID) ON DELETE CASCADE
			)	
		`);

        // Create tblVendor
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblVendor')
            CREATE TABLE tblVendor (
                VendorID nvarchar(50) PRIMARY KEY,
                VendorName nvarchar(50) NOT NULL
            )               
        `);

        // Create tblVendorInfo
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblVendorInfo')
            CREATE TABLE tblVendorInfo(
                VendorID nvarchar(50) PRIMARY KEY,
                AddressID nvarchar(50) NOT NULL,
                PhoneNumberID nvarchar(50) NOT NULL,
                EmailID nvarchar(50) NOT NULL,
                Notes nvarchar(50),
                FOREIGN KEY (VendorID) REFERENCES tblVendor(VendorID) ON DELETE CASCADE,
                FOREIGN KEY (AddressID) REFERENCES tblUserAddress(AddressID),
                FOREIGN KEY (PhoneNumberID) REFERENCES tblPhoneNumber(PhoneNumberID),
                FOREIGN KEY (EmailID) REFERENCES tblEmail(EmailID)
            )
        `);

        // Create tblVendorIngredient
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblVendorIngredient')
            CREATE TABLE tblVendorIngredient(
                VendorID nvarchar(50) NOT NULL,
                IngredientID nvarchar(50) NOT NULL,
                PricePerUnit DECIMAL(10,4),
                PRIMARY KEY (VendorID, IngredientID),
                FOREIGN KEY (VendorID) REFERENCES tblVendor(VendorID) ON DELETE CASCADE,
                FOREIGN KEY (IngredientID) REFERENCES tblIngredient(IngredientID)
            )
        `);

        // Create tblOrder
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblOrder')
            CREATE TABLE tblOrder(
                PONumber nvarchar(50) PRIMARY KEY,
                VendorID nvarchar(50) NOT NULL,
                IngredientID nvarchar(50) NOT NULL,
                Quantity DECIMAL(10,2),
                Price DECIMAL (10,2),
                CreateDateTime DateTime,
                FulfillDateTime DateTime DEFAULT NULL,
                FOREIGN KEY (VendorID) REFERENCES tblVendor(VendorID),
                FOREIGN KEY (IngredientID) REFERENCES tblIngredient(IngredientID)
            )
        `);


        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblAvailability')
            CREATE TABLE tblAvailability(
            	userID NVARCHAR(50) NOT NULL,
                weekID NVARCHAR(50) NOT NULL,
                dayID NVARCHAR(50) NOT NULL,
                shiftOne BIT NOT NULL,
                shiftTwo BIT NOT NULL,
                FOREIGN KEY (userID) REFERENCES tblUser(userID) on DELETE CASCADE,
                FOREIGN KEY (weekID) REFERENCES tblWeek(weekID) on DELETE NO ACTION,
                FOREIGN KEY (dayID) REFERENCES tblDay(dayID) on DELETE NO ACTION
            )
        `);


        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblTotalHours')
            CREATE TABLE tblTotalHours(
                userID NVARCHAR(50) NOT NULL,
                dayID NVARCHAR(50) NOT NULL,
                totalWeekHours DECIMAL (3,2)
                approved BIT DEFAULT 0,
                FOREIGN KEY (userID) REFERENCES tblUser(userID) on DELETE CASCADE,
                FOREIGN KEY (dayID) REFERENCES tblDay(dayID) on DELETE NO ACTION
        )
        `);


        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblDayNumInfo')
            CREATE TABLE tblDayNumInfo(
                dayNum NVARCHAR(50) PRIMARY KEY,
                dayDescription NVARCHAR(50)
        )
        `);


        // ADD HOWEVER MANY OTHER TABLES WE'RE GONNA NEED RIGHT HERE :)


    } catch (error) {
        console.log(error)
        throw error;
    }
}


module.exports = createTables;
