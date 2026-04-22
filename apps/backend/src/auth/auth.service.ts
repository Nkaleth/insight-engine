import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) { }

  login(body: any) {
    const payload = { email: body.email, sub: body.id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
