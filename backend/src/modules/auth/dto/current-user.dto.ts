import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Current user DTO
 * Used to return current user information
 * Includes basic user details
 * Used in /auth/me endpoint responses
 */
export class CurrentUserDto {
  @ApiProperty({
    description: 'User ID',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'User email',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'User name',
  })
  @IsString()
  name: string;
}
