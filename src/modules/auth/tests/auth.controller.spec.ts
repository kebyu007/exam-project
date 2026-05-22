import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockRes = { cookie: jest.fn(), json: jest.fn() } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should call register and return result', async () => {
      const dto = { name: 'Ali', email: 'ali@test.com', password: 'Test@123' };
      const result = { success: true, data: dto };
      mockService.register.mockResolvedValue(result);

      expect(await controller.signUp(dto as any, mockRes)).toEqual(result);
      expect(mockService.register).toHaveBeenCalledWith(dto, mockRes);
    });
  });

  describe('signIn', () => {
    it('should call login and return result', async () => {
      const dto = { email: 'ali@test.com', password: 'Test@123' };
      const result = { success: true, data: { email: dto.email } };
      mockService.login.mockResolvedValue(result);

      expect(await controller.signIn(dto as any, mockRes)).toEqual(result);
      expect(mockService.login).toHaveBeenCalledWith(dto, mockRes);
    });
  });
});
