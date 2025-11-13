# Contributing to Myanmar POS System

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/myanmar-pos-system.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit: `git commit -m "Add your feature"`
7. Push: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

See [SETUP.md](SETUP.md) for detailed setup instructions.

## Code Style

### JavaScript/Node.js
- Use ES6+ features
- Use async/await for asynchronous code
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable names
- Add comments for complex logic

### React
- Use functional components with hooks
- Keep components small and focused
- Use PropTypes or TypeScript for type checking
- Follow React best practices

### Database
- Use meaningful table and column names
- Add indexes for frequently queried columns
- Write efficient queries
- Document schema changes

## Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Example: `feat: add product search functionality`

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

## Testing

### Backend Tests
```bash
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

### Manual Testing
- Test all CRUD operations
- Test bot integrations
- Test error handling
- Test edge cases

## Bug Reports

When reporting bugs, include:
- Clear description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)

## Feature Requests

When requesting features:
- Describe the feature clearly
- Explain the use case
- Provide examples if possible
- Consider implementation complexity

## Code Review

All submissions require review. We use GitHub pull requests for this purpose.

## Areas for Contribution

### High Priority
- User authentication system
- Advanced reporting features
- Mobile app development
- Performance optimizations
- Security enhancements

### Medium Priority
- Additional payment methods
- Multi-language support (beyond Myanmar)
- Export/import functionality
- Email notifications
- SMS integration

### Low Priority
- UI/UX improvements
- Documentation improvements
- Code refactoring
- Additional bot platforms

## Questions?

Feel free to open an issue for questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
