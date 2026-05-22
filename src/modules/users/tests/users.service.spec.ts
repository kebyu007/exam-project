import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from '../user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../models/user.model';
import { NotFoundException } from '@nestjs/common';
import fs from 'node:fs/promises';

jest.mock('node:fs/promises');

describe('UsersService', () => {
  let userService: UsersService;
  const userMockModel = {
    find: jest.fn(),
    select: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userMockModel },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should create upload directory', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      await userService.onModuleInit();
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('user-profile'),
        { recursive: true },
      );
    });
  });

  describe('getAll', () => {
    it('should return users list', async () => {
      const data = [
        { id: 1, name: 'Ali' },
        { id: 2, name: 'Vali' },
      ];
      userMockModel.find.mockReturnThis();
      userMockModel.select.mockResolvedValue(data);

      const res = await userService.getAll();

      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(2);
      expect(res.data).toMatchObject(data);
    });
  });

  describe('updateProfile', () => {
    const mockFile = {
      buffer: Buffer.from('image'),
      mimetype: 'image/webp',
    } as Express.Multer.File;

    it('should throw NotFoundException if user not found', async () => {
      userMockModel.findById.mockResolvedValue(null);

      await expect(
        userService.updateProfile('507f1f77bcf86cd799439011', mockFile),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update profile image successfully', async () => {
      userMockModel.findById.mockResolvedValue({
        id: '507f1f77bcf86cd799439011',
      });
      userMockModel.updateOne.mockResolvedValue({});
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const res = await userService.updateProfile(
        '507f1f77bcf86cd799439011',
        mockFile,
      );

      expect(res.success).toBe(true);
    });
  });
});
