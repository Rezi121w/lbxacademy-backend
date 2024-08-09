import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
// Hashing And Hiding //
import { Exclude, Expose } from 'class-transformer';
// All Types //
import { TimerTypes } from '../enums/timer-types';
// Other Entities //
import { UserEntity } from '../../users/entities/user.entity';

@Entity('timers')
export class TimerEntity {
  @Expose()
  @PrimaryGeneratedColumn()
  id!: number;

  @Expose()
  @Column({ type: 'enum', enum: TimerTypes })
  type!: TimerTypes;

  @Expose()
  @Column({ default: false })
  isActive!: boolean;

  @Expose()
  @Column({ type: 'timestamp' })
  lastPause!: Date;

  @Expose()
  @Column({ type: 'timestamp' })
  targetDate?: Date;

  @Exclude()
  @Column({ default: false })
  warningEmailSent: boolean;

  @Exclude()
  @Column()
  userId!: number;

  @Exclude()
  @ManyToOne(() => UserEntity, (user: UserEntity) => user.timers, {
    cascade: true,
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user!: UserEntity;

  @Exclude()
  @CreateDateColumn()
  createdAt!: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt!: Date;

  @Exclude()
  @DeleteDateColumn()
  deletedAt!: Date;

  @Expose()
  get courseValue(): number {
    switch (this.type) {
      case TimerTypes.phone:
        return 1.0;
      case TimerTypes.tv:
        return 1.1;
      case TimerTypes.playstation:
        return 0.8;
      default:
        return 0;
    }
  }
}
