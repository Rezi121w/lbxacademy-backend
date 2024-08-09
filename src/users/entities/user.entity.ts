import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
// Hashing And Hiding //
import { Exclude, Expose } from 'class-transformer';
// All_Roles //
import { UserRoles } from '../../user-roles';
// Other Entities //
import { TimerEntity } from '../../timers/entities/timer.entity';

@Entity('users')
export class UserEntity {
  @Expose()
  @PrimaryGeneratedColumn()
  id!: number;

  @Expose()
  @Column({ type: 'enum', enum: UserRoles, default: UserRoles.user })
  role!: UserRoles;

  @Expose()
  @Column()
  firstName!: string;

  @Expose()
  @Column()
  lastName!: string;

  @Expose()
  @Column({ unique: true })
  email!: string;

  @Expose()
  @Column({ nullable: true })
  parentEmail!: string;

  @Exclude()
  @Column({ nullable: true })
  otpCode!: number;

  @Exclude()
  @Column({ default: 0 })
  otpAttemptCount!: number;

  @Exclude()
  @Column({ nullable: true })
  otpReportedAt!: Date;

  @Expose()
  @Column({ default: 0 })
  remainingMinutes!: number;

  @Exclude()
  @OneToMany(() => TimerEntity, (timer: TimerEntity) => timer.user)
  timers!: TimerEntity[];

  @Exclude()
  @CreateDateColumn()
  createdAt!: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt!: Date;

  @Exclude()
  @DeleteDateColumn()
  deletedAt!: Date;
}
