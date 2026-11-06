import type { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../lib/firebase-admin';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

// Valida o ID token do Firebase e carrega (ou cria) o usuário local.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Não autenticado.');

    const decoded = await firebaseAuth
      .verifyIdToken(header.slice(7))
      .catch(() => { throw new AppError(401, 'Token inválido ou expirado.'); });

    if (!decoded.email) throw new AppError(401, 'Conta sem email.');

    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });

    if (!user) {
      // Vincula usuários legados (criados antes da autenticação) pelo email, uma única vez
      const legacy = await prisma.user.findUnique({ where: { email: decoded.email } });
      if (legacy && !legacy.firebaseUid) {
        user = await prisma.user.update({ where: { id: legacy.id }, data: { firebaseUid: decoded.uid } });
      } else if (!legacy) {
        const queryName = typeof req.query.name === 'string' ? req.query.name : '';
        const name = (queryName || (decoded.name as string | undefined) || 'Estudante').slice(0, 100);
        user = await prisma.user.create({ data: { firebaseUid: decoded.uid, email: decoded.email, name } });
      } else {
        throw new AppError(403, 'Email já vinculado a outra conta.');
      }
    }

    req.user = {
      id: user.id,
      firebaseUid: decoded.uid,
      email: user.email,
      name: user.name,
      level: user.level,
      studyTime: user.studyTime,
    };
    next();
  } catch (err) {
    next(err);
  }
}
