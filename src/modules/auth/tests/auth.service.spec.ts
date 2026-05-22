import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../users/models/user.model';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRes = {
    cookie: jest.fn(),
    json: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('login', () => {
    const signInDto = { email: 'test@test.com', password: 'Test@123' };

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        authService.login(signInDto, mockRes as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if password mismatch', async () => {
      mockUserModel.findOne.mockResolvedValue({
        id: '1',
        email: signInDto.email,
        password: 'hashedPass',
        role: 'user',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login(signInDto, mockRes as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should login successfully and set cookies', async () => {
      const user = {
        id: '1',
        email: signInDto.email,
        password: 'hashedPass',
        role: 'user',
        toObject: jest.fn().mockReturnValue({ id: '1', email: signInDto.email }),
      };
      mockUserModel.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('token');
      mockConfigService.get.mockReturnValue(3600);
      mockRes.json.mockReturnValue({ success: true, data: user.toObject() });

      const result = await authService.login(signInDto, mockRes as any);

      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: user.toObject(),
      });
      expect(result).toEqual({ success: true, data: user.toObject() });
    });
  });

  describe('register', () => {
    const signUpDto = {
      name: 'Test User',
      email: 'new@test.com',
      password: 'Test@123',
      age: 25,
    };

    it('should throw ConflictException if user already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: signUpDto.email });

      await expect(
        authService.register(signUpDto, mockRes as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should register successfully and set cookies', async () => {
      const createdUser = {
        id: '2',
        ...signUpDto,
        role: 'user',
        toObject: jest.fn().mockReturnValue({ id: '2', email: signUpDto.email }),
      };
      mockUserModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPass');
      mockUserModel.create.mockResolvedValue(createdUser);
      mockJwtService.signAsync.mockResolvedValue('token');
      mockConfigService.get.mockReturnValue(3600);
      mockRes.json.mockReturnValue({ success: true, data: createdUser.toObject() });

      const result = await authService.register(signUpDto, mockRes as any);

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: signUpDto.email }),
      );
      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdUser.toObject(),
      });
      expect(result).toEqual({ success: true, data: createdUser.toObject() });
    });
  });
});
