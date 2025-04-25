const mongoose = require('mongoose');
const { Schema } = mongoose;
const paginate = require('mongoose-paginate-v2');

const BehaviorPointConditionSchema = new Schema({
  module_id: {
    type: Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    required: false
  },
  point: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: false
  },
  deadline: {
    type: Number,
    required: false
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: Boolean,
    default: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    // required: true,
  }
}, { timestamps: true });

const BehaviorPointCategorySchema = new Schema({
  category_for: {
    type: String,
    enum: ['student', 'teacher', 'school-admin'],
    required: true
  },
  category_name: {
    type: String,
    required: true
  },
  point_type: {
    type: String,
    enum: ['Positive', 'Negative'],
    required: true
  },
  point: {
    type: Number,
    required: false
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: Boolean,
    default: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    // required: true,
  }
}, { timestamps: true });

const BehaviorPointCouponSchema = new Schema({
  coupon_for: {
    type: String,
    enum: ['student', 'teacher', 'school-admin'],
    required: true
  },
  coupon_value: {
    type: Number,
    required: true
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: Boolean,
    default: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    // required: true,
  }
}, { timestamps: true });

const BehaviorPointCouponApprovalSchema = new Schema({
  requested_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coupon_id: {
    type: Schema.Types.ObjectId,
    ref: 'BehaviorPointCoupon',
    required: true
  },
  requested_date: {
    type: Date,
    required: true
  },
  requested_coupon: {
    type: Number,
    required: true
  },
  remark: {
    type: String
  },
  is_issued: {
    type: Boolean,
    default: false
  },
  issued_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    // required: true,
  }
}, { timestamps: true });

const BehaviorPointAssignPointSchema = new Schema({
  user_type: {
    type: String,
    enum: ['student', 'teacher', 'school-admin'],
    required: true
  },
  assigned_to: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: 'BehaviorPointCategory',
    required: true
  },
  point_type: {
    type: String,
    enum: ['Positive', 'Negative'],
    required: true
  },
  remark: {
    type: String
  },
  assigned_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    // required: true,
  },
  is_read : {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const BehaviorPointPointSchema = new Schema({
  user_type: {
    type: String,
    enum: ['student', 'teacher', 'school-admin'],
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalPoints: {
    type: Number,
    required: false
  },
  reedemedPoints: {
    type: Number,
    required: false
  },
  RemainingPoints: {
    type: Number,
    required: false
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    // required: true,
  }
}, { timestamps: true });

BehaviorPointCategorySchema.plugin(paginate);
BehaviorPointConditionSchema.plugin(paginate);
BehaviorPointCouponSchema.plugin(paginate);
BehaviorPointCouponApprovalSchema.plugin(paginate);
BehaviorPointAssignPointSchema.plugin(paginate);
BehaviorPointPointSchema.plugin(paginate);
module.exports = {
  BehaviorPointCondition: mongoose.model('BehaviorPointCondition', BehaviorPointConditionSchema),
  BehaviorPointCategory: mongoose.model('BehaviorPointCategory', BehaviorPointCategorySchema),
  BehaviorPointCoupon: mongoose.model('BehaviorPointCoupon', BehaviorPointCouponSchema),
  BehaviorPointCouponApproval: mongoose.model('BehaviorPointCouponApproval', BehaviorPointCouponApprovalSchema),
  BehaviorPointAssignPoint: mongoose.model('BehaviorPointAssignPoint', BehaviorPointAssignPointSchema),
  BehaviorPointPoint: mongoose.model('BehaviorPointPoint', BehaviorPointPointSchema)
};