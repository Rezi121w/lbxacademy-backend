import {IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min} from "class-validator";


export class ChangeUserDto {

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    firstName!: string;

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    lastName!: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(70)
    age!: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    pass!: string;

    @IsOptional()
    @IsArray()
    @IsNumber({},{ each: true })
    coursesIds!: number[];
}