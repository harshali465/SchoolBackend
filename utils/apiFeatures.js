class APIFeatures {
  constructor(queryString) {
    this.queryString = queryString;
  }
  search() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'minBheviourPoint', 'maxBheviourPoint'];
    excludedFields.forEach((el) => delete queryObj[el]);
  
    for (const field in queryObj) {
      
      if (queryObj[field]) { 
        if (field === 'search') {
          // Match 'search' field against firstName and lastName with case-insensitivity
          const searchTerm = queryObj[field];
          if (searchTerm.includes(' ')) {
            // Split search term into first and last names
            const [firstNameTerm, ...lastNameTerms] = searchTerm.split(' ');
            const firstNameRegex = new RegExp(`.*${firstNameTerm}.*`, 'i'); // Regex for first name
            const lastNameRegex = new RegExp(`.*${lastNameTerms.join(' ')}.*`, 'i'); // Regex for last name
            queryObj.$or = [
              { firstName: firstNameRegex, lastName: lastNameRegex },
              { lastName: lastNameRegex }
            ];
          } else {
            // If the search term doesn't include a space, match it against either firstName or lastName
            const searchRegex = new RegExp(`.*${searchTerm}.*`, 'i');
            queryObj.$or = [
              { firstName: searchRegex },
              { lastName: searchRegex }
            ];
          }
          delete queryObj.search; // Remove the 'search' field after processing
        }
        else if(field === 'stageGradeSection'||field==="teacherType" ||field== "category"|| field=='academicYearId'){
          queryObj[field] = queryObj[field]
        }
        else if(field=="is_issued"){
          this.queryString={is_issued:queryObj[field]}
        }
        else {
          queryObj[field] = { $regex: new RegExp(queryObj[field].trim(), 'i') }; // 'i' for case-insensitive
        }
      } else {
        delete queryObj[field]; // Remove the field if it's empty
      }
    }
  
    // Handle behavior points filtering
    if (this.queryString.minBheviourPoint) {
      queryObj['behaviousPoints.positivePoints'] = {
        ...queryObj['behaviousPoints.positivePoints'],
        $gte: this.queryString.minBheviourPoint
      };
    }
    if (this.queryString.maxBheviourPoint) {
      queryObj['behaviousPoints.positivePoints'] = {
        ...queryObj['behaviousPoints.positivePoints'],
        $lte: this.queryString.maxBheviourPoint
      };
    }
  
    if (this.queryString.active) {
      queryObj.active = this.queryString.active;
    }
    delete queryObj.search;
    this.filter = queryObj;
    return this;
  }
  



  filterRegex(param) {
    const query = { ...this.queryString };
    if (!query[param]) {
      delete this.filter[param];
      return this;
    }
    // If nosql injection or parameter pollution is done then disallow
    if (typeof query[param] !== 'string') {
      query[param] = '';
    }
    const queryObj = {};
    queryObj[param] = query[param];
    // 1B) MongoDB Text search on the DB fields with text index
    this.filter = { $text: { $search: queryObj[param] }, ...this.filter }; //{ $regex: queryObj[param], $options: "i" };
    delete this.filter[param];
    return this;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    // 1B) Advanced filtering
    // eslint-disable-next-line no-restricted-syntax
    for (const field in queryObj) {
      if (
        (typeof queryObj[field] === 'string' ||
          queryObj[field] instanceof String) &&
        queryObj[field].split('||').length > 1
      ) {
        queryObj[field] = { $in: queryObj[field].split('||') };
      }
    }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.filter = JSON.parse(queryStr);
    return this;
  }

  // populate(params) {
  //   if (!this.options) this.options = {};
  //   this.options.populate = params;
  //   return this;
  // }
populate(params) {
  if (!this.options) this.options = {};
  if (!this.options.populate) this.options.populate = [];

  if (Array.isArray(params)) {
    this.options.populate.push(...params); // For array of populations
  } else {
    this.options.populate.push(params); // For single population
  }

  return this;
}


  sort() {
    if (!this.options) this.options = {};
    if (this.queryString.sort) {
      this.options.sort = this.queryString.sort.split(',').join(' ');
    } else {
      this.options.sort = '-createdAt';
    }

    return this;
  }

  limitFields(maxFilterList = null, excludeFilterList = null) {
    if (!this.options) this.options = {};
    //  To exclude list of fields
    if (excludeFilterList && !maxFilterList) {
      this.options.select = excludeFilterList.join(' ');
      return this;
    }
    if (
      this.queryString.fields &&
      typeof this.queryString.fields === 'string'
    ) {
      // this.options.select = this.queryString.fields.split(",").join(" ");
      this.options.select = this.queryString.fields.split(',');
      if (maxFilterList) {
        this.options.select = this.options.select.filter((value) =>
          maxFilterList.includes(value),
        );
      }
      this.options.select = this.options.select.join(' ');
      if (this.options.select) return this;
    }
    // If no selection is provided, then filter using maxFilterList
    if (maxFilterList) {
      this.options.select = maxFilterList.join(' ');
      return this;
    }

    //If maxFilterList is also not provided, then only remove __v from response field
    this.options.select = '-__v';
    return this;
  }

  paginate() {
    if (!this.options) this.options = {};
    const page = this.queryString.page * 1 || 1;
    let limit = this.queryString.limit * 1 || 100;
    if (limit > 100) limit = 100;
    this.options = { ...this.options, page, limit };
    return this;
  }

  async exec(Model) {
    if (!this.options) this.options = { page: 1, limit: 100 };
    if (!this.filter) this.filter = {};
    this.data = await Model.paginate(this.filter, this.options);
    return this;
  }
}
module.exports = APIFeatures;

