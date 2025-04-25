const Joi = require("joi");
const { Op, Sequelize } = require("sequelize");
const axios = require("axios");
const getMessage = require("../../../transaction/helpers/message.helpers");
const eventService = require("../../../transaction/services/event.service")
const forumService = require("../../../transaction/services/forum.service");
const userService = require("../../../transaction/services/user.service");
const {Forum,ForumSuggestion} = require("../../../transaction/loaders/forum");



const getAllForums = async (req, res) => {
    const locale = req.header("app-lang") || "DE";
    try {
      const limit = parseInt(req.query.limit) || 15;
      let page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * parseInt(limit);
      const sortBy = [ "isActive","title","createdOn","categoryName"].includes(req.query.sortBy)? req.query.sortBy : "createdOn";
      const orderBy = ["ASC", "DESC"].includes(req.query.orderBy)?req.query.orderBy : "DESC"
      let whereInterest = {};
      if(req.query.search != ""){
        whereInterest = {
            [Op.or]: [{
                title: {
                  [Op.like]: `%${req.query.search }%`,
                },
              },
              {
                userId: { [Op.in]: await userService.searchUsers(req.query.search) },
              },
              {
                talkCategoryId: { [Op.in]: await forumService.searchCatrgories(req.query.search) },
                
              }
  
            ],
          };
      }

      var talkList = await Forum.findAll({
        where: whereInterest,
        attributes: ["id", "userId", "title", "talkCategoryId", "createdOn","isActive","categoryArr"],
        order: [[`${sortBy}`,`${orderBy}`]],
        limit: limit,
        offset: offset,
      });


      const count = await Forum.count({where: whereInterest});
    
      if (count <= 0)
        return res.send({ code: 204, status: false, message: await getMessage("FORUM_NOT_FOUND", locale) });
      const totalPages = Math.ceil(count / limit);

      if(req.query.sortBy == "accountName" || req.query.sortBy == "category"){
        talkList = await Forum.findAll({
            where: whereInterest,
            attributes: ["id", "userId", "title", "talkCategoryId", "createdOn","isActive","categoryArr"],
          });
      }
  
      if (Array.isArray(talkList) && talkList.length) {
        let mapData = await Promise.all(
          talkList.map(async (list) => {
            return new Promise(async (resolve, reject) => {
              try { 
                list.dataValues["createdByUser"] = await eventService.getUser(list.userId),
                list.dataValues["categoryName"] = await forumService.forumCategory(list.talkCategoryId),
  
                  resolve(list);
              } catch (err) {
                console.log("mappedData err:", err);
                resolve(list);
              }
            });
          })
        )

        if(req.query.sortBy == "accountName" || req.query.sortBy == "category"){
            let froumList ;
            if(orderBy == "ASC"){
              if(req.query.sortBy == "accountName"){
                  froumList=talkList.sort((a,b)=>a.dataValues.createdByUser.profile.dataValues.profileName.localeCompare(b.dataValues.createdByUser.profile.dataValues.profileName))
              }else if(req.query.sortBy == "category"){
                  froumList=talkList.sort((a,b)=>a.dataValues.categoryName.localeCompare(b.dataValues.categoryName))
              }
            }else if(orderBy == "DESC"){
              if(req.query.sortBy == "accountName"){
                  froumList=talkList.sort((a,b)=>b.dataValues.createdByUser.profile.dataValues.profileName.localeCompare(a.dataValues.createdByUser.profile.dataValues.profileName))
              }else if(req.query.sortBy == "category"){
                 froumList=talkList.sort((a,b)=>b.dataValues.categoryName.localeCompare(a.dataValues.categoryName))
              }

            }
         
        
        
              page = parseInt(req.query.page) || 1;
             let startIndex = (page - 1) * limit;
             let endIndex = startIndex + limit;
             var talkList = froumList.slice(startIndex, endIndex);
        return res.send({ code: 200, status: true, message: await getMessage("FORUM_RETRIEVED", locale), data: { talkList, count: count, totalPages: totalPages } });

          }

        return res.send({ code: 200, status: true, message: await getMessage("FORUM_RETRIEVED", locale), data: { talkList, count: count, totalPages: totalPages } });
      }
    } catch (error) {
      console.log(error);
      res.send({ code: 500, status: false, message: await getMessage("SOMETHING_WENT_WRONG", locale) });
    }
  };


const listTopic = async (req, res) => {
    const locale = req.header("app-lang") || "DE";
    try {
      const limit = parseInt(req.query.limit) || 15;
      let page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * parseInt(limit);
      const search = req.query.search || "";
      const sortBy = [ "isActive","createdOn","topicSuggestion","orderValue"].includes(req.query.sortBy)? req.query.sortBy : "createdOn";
      const orderBy = ["ASC", "DESC"].includes(req.query.orderBy)?req.query.orderBy : "DESC"
      let whereInterest = {isDeleted:false};
      if(req.query.search != ""){
        whereInterest = {
          isDeleted:false,
          [Op.or]: [
            {
              topicSuggestion: {
                [Op.like]: `%${search}%`,
              },
            },
            {
              userId: { [Op.in]: await userService.searchUsers(req.query.search) },
            },
          ],
        }
      }
      var topicList = await ForumSuggestion.findAll({
        where:whereInterest,
        attributes:["id","userId","orderValue","topicSuggestion","isActive","createdOn"],
        order: [[`${sortBy}`,`${orderBy}`]],
        limit: limit,
        offset: offset,
      })
  
      let count = await ForumSuggestion.count({
        where:whereInterest,
      });
      if (topicList.length <= 0) {
        topicList.length = 0;
      }
      if(req.query.sortBy == "accountName"){
        topicList = await ForumSuggestion.findAll({
          where:whereInterest,
          attributes:["id","userId","orderValue","topicSuggestion","isActive","createdOn"],
        
        })
      }
  
      const totalPages = Math.ceil(count/ limit);
      if (Array.isArray(topicList) && topicList.length) {
        let mapData = await Promise.all(
          topicList.map(async (list) => {
            return new Promise(async (resolve, reject) => {
              try {
               list.dataValues["createdBy"] = await eventService.getUser(list.userId ),
                  resolve(list);
              } catch (err) {
                console.log("mappedData err:", err);
                resolve(list);
              }
            });
          })
        );
        if(req.query.sortBy == "accountName"){
          let froumList;
          if(req.query.orderBy == "ASC"){
            froumList=topicList.sort((a,b)=>a.dataValues.createdBy.profile.dataValues.profileName.localeCompare(b.dataValues.createdBy.profile.dataValues.profileName))
          }else if(req.query.orderBy == "DESC"){
            froumList=topicList.sort((a,b)=>b.dataValues.createdBy.profile.dataValues.profileName.localeCompare(a.dataValues.createdBy.profile.dataValues.profileName))

          }
          page = parseInt(req.query.page) || 1;
          let startIndex = (page - 1) * limit;
          let endIndex = startIndex + limit;
          var topicList = froumList.slice(startIndex, endIndex);

          return res.send({
            code: 200,
            status: true,
            message: getMessage("FORUM_TOPIC_LIST", locale),
            data: { topicList, count: count, totalPages: totalPages },
          });
     
        }

        return res.send({
          code: 200,
          status: true,
          message: getMessage("FORUM_TOPIC_LIST", locale),
          data: { topicList, count: count, totalPages: totalPages },
        });
      }
    } catch (error) {
      console.log(error);
      return res.send({
        code: 500,
        status: false,
        message: getMessage("SOMETHING_WENT_WRONG", locale),
      });
    }
  };


  module.exports ={
    getAllForums,
    listTopic
  }