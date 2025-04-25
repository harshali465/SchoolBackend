const Stage = require('../models/stage.model');
const Grade = require('../models/grade.model');
const Section = require('../models/section.model');
const StageGradeSectionTime = require('../models/stageGradeSectionTime.model');

module.exports.findOrCreateStageGradeSection = async (stage, grades, sections, startTime, endTime, classTeachers, connection) => {
  // Define the models
  const StageModel = await connection.model('Stage', Stage.schema);
  const GradeModel = await connection.model('Grade', Grade.schema);
  const SectionModel = await connection.model('Section', Section.schema);
  const StageGradeSectionTimeModel = await connection.model('StageGradeSectionTime', StageGradeSectionTime.schema);

  let stageId;

  // Check if the stage is passed as an ID or name
  if (stage.id) {
    // Stage already exists, use the provided ID
    stageId = stage.id;
  } else if (stage.name) {
    // Check if the stage already exists by name
    let existingStage = await StageModel.findOne({ stage: stage.name });
    if (!existingStage) {
      // Create new stage if it doesn't exist
      let newStage = new StageModel({ stage: stage.name });
      existingStage = await newStage.save();
    }
    stageId = existingStage.id;
  }

  // Process grades and sections similarly
  for (let gradeData of grades) {
    let gradeId;
    if (gradeData.id) {
      gradeId = gradeData.id;
    } else if (gradeData.name) {
      let existingGrade = await GradeModel.findOne({ grade: gradeData.name });
      if (!existingGrade) {
        let newGrade = new GradeModel({ grade: gradeData.name });
        existingGrade = await newGrade.save();
      }
      gradeId = existingGrade.id;
    }

    for (let sectionData of sections) {
      let sectionId;
      if (sectionData.id) {
        sectionId = sectionData.id;
      } else if (sectionData.name) {
        let existingSection = await SectionModel.findOne({ section: sectionData.name });
        if (!existingSection) {
          let newSection = new SectionModel({ section: sectionData.name });
          existingSection = await newSection.save();
        }
        sectionId = existingSection.id;
      }

      // Find or create StageGradeSectionTime for each combination of stage, grade, and section
      let stageGradeSectionTime = await StageGradeSectionTimeModel.findOne({
        stage: stageId,
        grade: gradeId,
        section: sectionId,
      });

      if (!stageGradeSectionTime) {
        stageGradeSectionTime = new StageGradeSectionTimeModel({
          stage: stageId,
          grade: gradeId,
          section: sectionId,
          start_time: startTime,
          end_time: endTime,
          class_teachers: classTeachers
        });
        await stageGradeSectionTime.save();
      }
    }
  }
};
