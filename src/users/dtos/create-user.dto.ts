import {IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min} from "class-validator";


export class CreateUserDto {

    @IsNotEmpty()
    @IsString()
    firstName!: string;

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

    @IsArray()
    @IsNumber({},{ each: true })
    coursesIds!: number[];
}