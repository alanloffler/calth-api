import { PartialType } from "@nestjs/mapped-types";

import { CreateBlockedDayDto } from "@blocked-days/dto/create-blocked-day.dto";

export class UpdateBlockedDayDto extends PartialType(CreateBlockedDayDto) {}
