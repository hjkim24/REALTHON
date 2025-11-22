"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const course_service_1 = require("./course.service");
const recommend_dto_1 = require("./dto/recommend.dto");
const recommend_service_1 = require("./recommend.service");
let RecommendController = class RecommendController {
    constructor(service, courseService) {
        this.service = service;
        this.courseService = courseService;
    }
    async getRecommendation(dto) {
        return await this.service.recommend(dto);
    }
    async uploadTranscript(file) {
        if (!file) {
            throw new common_1.BadRequestException('파일이 제공되지 않았습니다.');
        }
        return await this.courseService.uploadTranscript(file);
    }
};
exports.RecommendController = RecommendController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recommend_dto_1.RecommendDto]),
    __metadata("design:returntype", Promise)
], RecommendController.prototype, "getRecommendation", null);
__decorate([
    (0, common_1.Post)('course/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecommendController.prototype, "uploadTranscript", null);
exports.RecommendController = RecommendController = __decorate([
    (0, common_1.Controller)('recommend'),
    __metadata("design:paramtypes", [recommend_service_1.RecommendService,
        course_service_1.CourseService])
], RecommendController);
//# sourceMappingURL=recommend.controller.js.map