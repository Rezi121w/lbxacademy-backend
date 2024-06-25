import {HttpException, HttpStatus, Injectable, UnauthorizedException} from '@nestjs/common';
// Super-Services //
import * as fs from "node:fs";
import {JwtService} from "@nestjs/jwt";
import {Expose, plainToClass} from "class-transformer";
// Repositories //
import {UsersRepository} from "./users.repository";
import {CourseRepository} from "../course/course.repository";
// DTos //
import {LoginDto} from "./dtos/login.dto";
import {CreateUserDto} from "./dtos/create-user.dto";
import {ChangeUserDto} from "./dtos/change-user.dto";

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository,
                private readonly courseRepository: CourseRepository,
                private jwtService: JwtService) {}

    // User Functions //

    async login(data: LoginDto) {
        const user = await this.usersRepository.findOneByUserName(data.user);
        if(!user) {
            throw new HttpException('ასეთი მომხმარებელი არ არსებობს', HttpStatus.NOT_FOUND);
        }

        const isPasswordCorrect = await user.isPasswordCorrect(data.pass);
        if(!isPasswordCorrect) {
            throw new HttpException('პაროლი არასწორია', HttpStatus.FORBIDDEN);
        }
        if(user.isBlocked) {
            throw new HttpException('ბოდიშით, თქვენ ხართ დაბლოკილი!', HttpStatus.FORBIDDEN);
        }

        const result = {
            id: user.id,
            role: user.role,
            accessToken: `${this.jwtService.sign({id: user.id, role: user.role} )}`,
        };

        return plainToClass(LoginReturn, result);
    }

    async getMe(id: number) {
        return await this.usersRepository.findOneById(id);
    }

    // Admin Functions //

    async getAllUsers(search?: string) {
        if(search) {
            return await this.usersRepository.searchStudents(search);
        }

        return await this.usersRepository.findAllUsers();
    }

    async getUser(id: number) {
        const user = await this.usersRepository.findOneById(id);
        if(!user) {
            throw new HttpException("ასეთი მომხმარებელი არ არსებობს!", HttpStatus.NOT_FOUND);
        }

        return user;
    }

    async getAllAdmins(search?: string) {
        if(search) {
            return await this.usersRepository.searchAdmins(search);
        }

        return await this.usersRepository.findAllAdmins();
    }

    async createUser(data: CreateUserDto) {
        const newUser = this.usersRepository.create(data);
        const newPassword = this.generatePassword(12);

        if(!data.pass) {
            await newUser.setPassword(newPassword);

        } else {
            await newUser.setPassword(data.pass);
        }

        if (data.coursesIds.length > 0) {
            const courses = await this.courseRepository.findByIds(data.coursesIds);
            newUser.learningCourses = courses;
        }

        const user = await this.usersRepository.save(newUser);
        const userInfo = `ID: ${user.id} --- სტუდენტი: ${user.userName} --- პაროლი: ${data.pass ? data.pass : newPassword}\n`;

        this.savePasswordInTXT(userInfo);
        return "სტუდენტი წარმატებით დაემატა!";
    }

    async changeUser(id: number, data: ChangeUserDto) {
        const user = await this.usersRepository.findOneById(id);
        if(!user) {
            throw new HttpException("ასეთი მომხმარებელი ვერ მოიძებნა", HttpStatus.NOT_FOUND);
        }

        if (data.firstName) {
            user.firstName = data.firstName;
        } if (data.lastName) {
            user.lastName = data.lastName;
        } if (data.age) {
            user.age = data.age;
        } if (data.pass) {
            await user.setPassword(data.pass);
        }

        if (data.coursesIds && data.coursesIds.length > 0) {
            const courses = await this.courseRepository.findByIds(data.coursesIds);
            user.learningCourses = courses;
        }

        await this.usersRepository.save(user);

        this.editUserInTXT(user.id, user.firstName, user.lastName, data.pass ? data.pass : null);
        return "სტუდენტის ინფორმაცია წარმატებით შეიცვალა!"
    }

    async blockUser(id: number) {
        const user = await this.usersRepository.findOneById(id);
        if(!user) {
            throw new HttpException("ასეთი მომხმარებელი ვერ მოიძებნა", HttpStatus.NOT_FOUND);
        }
        user.isBlocked = !user.isBlocked;

        await this.usersRepository.save(user);
        return `მომხმარებელი წარმატებით ${user.isBlocked ? "დაიბლოკა" : "განიბლოკა"}!`
    }

    async deleteUser(id: number) {
        await this.usersRepository.softDelete(id);
        return "სტუდენტი წარმატებით წაიშალა!"
    }

    // Get AccessToken Payload //
    async getAccessToken(authorizationHeader: string) {

        if (!authorizationHeader) {
            throw new UnauthorizedException('UnAuthorized');
        }

        const [bearer, token] = authorizationHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
            throw new UnauthorizedException('Unknown Token');
        }

        let payload;

        try {
            payload = this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }

        const user = await this.usersRepository.findOneById(payload.id);
        const isBlocked = user.isBlocked;

        return [payload, isBlocked];
    }

    // Generate Password Random -- AND Write In TXT FILE //
    generatePassword(length: number) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }

        return password;
    }

    savePasswordInTXT(userInfo: string) {
        fs.appendFile('students.txt', userInfo, (err) => {
            if (err) console.log(err);
        });
    }

    editUserInTXT(id: number, updatedFirstName: string, updatedLastName: string, updatedPassword?: string) {
        const filePath = 'students.txt';

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('cannt read file:', err);
                return;
            }

            const lines = data.split('\n');
            let oldPassword = "";

            let indexToUpdate = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(`ID: ${id}`)) {
                    indexToUpdate = i;
                    const components = lines[i].split(' --- ');
                    oldPassword = components.find(component => component.startsWith('პაროლი: '));
                    break;
                }
            }

            if (indexToUpdate === -1) {
                return;
            }

            const updatedUserInfo = `ID: ${id} --- სტუდენტი: ${updatedFirstName} ${updatedLastName} --- ${updatedPassword ? "პაროლი: " + updatedPassword : oldPassword}`;
            lines[indexToUpdate] = updatedUserInfo;

            fs.writeFile(filePath, lines.join('\n'), 'utf8', (err) => {
                if (err) {
                    console.error('Failed to reWRITE file:', err);
                }
            });

        });
    }

}


// DTos Expose  //
class LoginReturn {
    @Expose()
    id: number;

    @Expose()
    role: string;

    @Expose()
    accessToken: string;
}
