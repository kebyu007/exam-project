import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UsersService } from '../user.service';

describe('UserController', () => {
  let controller: UserController;

  const mockService = {
    getAll: jest.fn(),
    updateProfile: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all users', async () => {
      const result = { success: true, data: [{ name: 'Ali' }] };
      mockService.getAll.mockResolvedValue(result);

      expect(await controller.getAll()).toEqual(result);
      expect(mockService.getAll).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update profile image', async () => {
      const mockFile = {
        buffer: Buffer.from('img'),
        mimetype: 'image/webp',
      } as Express.Multer.File;
      mockService.updateProfile.mockResolvedValue({ success: true });

      const result = await controller.updateProfile(
        '507f1f77bcf86cd799439011',
        mockFile,
      );

      expect(result).toEqual({ success: true });
      expect(mockService.updateProfile).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockFile,
      );
    });
  });

  describe('delete', () => {
    it('delete user', async () => {
      mockService.delete.mockResolvedValue({ success: true });
      const res = await controller.delete('507f1f77bcf86cd799439011');

      expect(res.success).toEqual(true);
      expect(mockService.delete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });
});
