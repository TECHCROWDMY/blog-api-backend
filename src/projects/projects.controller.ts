import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Req, 
  UseGuards, // Imported to enable authentication guards
  ParseIntPipe // Used for strict type checking on ID parameters
} from '@nestjs/common'; 
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Request } from 'express'; // Import Request type for better type safety
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

// Define an interface for the authenticated request user object
// This MUST match the object returned by your JwtStrategy validate method
interface AuthenticatedRequest extends Request {
  user: {
    id: number; // The user ID extracted from the JWT payload
    username: string;
    email: string;
  };
}

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // 🛑 FIX: This runs the JWT strategy, populating req.user
  async create(
    @Body() createProjectDto: CreateProjectDto, 
    @Req() req: AuthenticatedRequest // Using typed request object
  ) {
   
    const userId = req.user.id; 

    // Pass both the DTO and the userId to the service
    return this.projectsService.create(createProjectDto, userId); 
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard) // Protected route
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProjectDto: UpdateProjectDto) {
    // The userId (req.user.id) is implicitly available here if needed for authorization
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard) // Protected route
  remove(@Param('id', ParseIntPipe) id: number) {
    // The userId (req.user.id) is implicitly available here if needed for authorization
    return this.projectsService.remove(id);
  }
}