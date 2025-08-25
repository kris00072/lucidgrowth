import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { Email, EmailStatus } from './schemas/email.schema';

@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  async create(@Body() createEmailDto: CreateEmailDto): Promise<Email> {
    return this.emailService.create(createEmailDto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    return this.emailService.findAll(pageNum, limitNum);
  }

  @Get(':emailId')
  async findOne(@Param('emailId') emailId: string): Promise<Email> {
    return this.emailService.findOne(emailId);
  }

  @Get(':emailId/status')
  async getStatus(@Param('emailId') emailId: string): Promise<{ status: EmailStatus }> {
    const email = await this.emailService.findOne(emailId);
    return { status: email.status };
  }

  @Post(':emailId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('emailId') emailId: string,
    @Body() updateEmailDto: UpdateEmailDto,
  ): Promise<Email> {
    return this.emailService.update(emailId, updateEmailDto);
  }

  @Post(':emailId/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('emailId') emailId: string,
    @Body() body: { status: EmailStatus },
  ): Promise<Email> {
    return this.emailService.updateStatus(emailId, body.status);
  }

  @Delete(':emailId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('emailId') emailId: string): Promise<void> {
    return this.emailService.remove(emailId);
  }

  @Get('stats/overview')
  async getStats() {
    return this.emailService.getStats();
  }
}
