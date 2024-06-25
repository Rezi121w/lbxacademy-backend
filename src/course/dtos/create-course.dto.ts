import { IsBoolean,  IsNotEmpty,  IsOptional, IsString} from "class-validator";


export class CreateCourseDto {


    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsString()
    abbr!: string;

    @IsOptional()
    @IsString()
    meetingLink!: string;

    @IsBoolean()
    @IsNotEmpty()
    isMain!: boolean;


}