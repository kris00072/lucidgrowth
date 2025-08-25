import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get()
  getInfo(): { 
    name: string; 
    version: string; 
    environment: string;
    description: string;
  } {
    return {
      name: 'Lucid Growth Backend API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      description: 'Gmail email analysis and processing API',
    };
  }
}



