import { 
    initializeBoard, 
    algebraicToCoords, 
    coordsToAlgebraic,
    parseMoveTranscript,
    parseColorTranscript,
    parseDifficultyTranscript,
    findPossibleMoves,
    executeMove,
    boardToFEN
} from '../chess_logic';
import { PlayerColor, Difficulty, Piece, SessionMode } from '../utils/types';

describe('Chess Logic Tests', () => {
    describe('Board Initialization', () => {
        test('should initialize board correctly', () => {
            const board = initializeBoard();
            expect(board).toBeDefined();
            expect(board.length).toBe(8);
            expect(board[0]?.length).toBe(8);
            expect(board[0]?.join('')).toBe('rnbqkbnr');
            expect(board[7]?.join('')).toBe('RNBQKBNR');
        });
    });

    describe('Coordinate Conversion', () => {
        test('should convert algebraic to coordinates correctly', () => {
            const testCases = [
                { algebraic: 'a1', expected: [7, 0] },
                { algebraic: 'h8', expected: [0, 7] },
                { algebraic: 'e4', expected: [4, 4] },
                { algebraic: 'd5', expected: [3, 3] }
            ];

            testCases.forEach(({ algebraic, expected }) => {
                const coords = algebraicToCoords(algebraic);
                expect(coords).toEqual(expected);
            });
        });

        test('should convert coordinates to algebraic correctly', () => {
            const testCases = [
                { coords: [7, 0], expected: 'a1' },
                { coords: [0, 7], expected: 'h8' },
                { coords: [4, 4], expected: 'e4' },
                { coords: [3, 3], expected: 'd5' }
            ];

            testCases.forEach(({ coords, expected }) => {
                const algebraic = coordsToAlgebraic(coords as [number, number]);
                expect(algebraic).toBe(expected);
            });
        });

        test('should handle invalid algebraic notation', () => {
            expect(algebraicToCoords('')).toBeNull();
            expect(algebraicToCoords('a')).toBeNull();
            expect(algebraicToCoords('a9')).toBeNull();
            expect(algebraicToCoords('i1')).toBeNull();
        });
    });

    describe('Move Parsing', () => {
        test('should parse move transcripts correctly', () => {
            const testCases = [
                { input: 'rook to d4', expected: { piece: 'r', target: 'd4' } },
                { input: 'pawn e5', expected: { piece: 'p', target: 'e5' } },
                { input: 'knight f3', expected: { piece: 'k', target: 'f3' } },
                { input: 'bishop to c4', expected: { piece: 'b', target: 'c4' } },
                { input: 'queen d2', expected: { piece: 'q', target: 'd2' } },
                { input: 'king e2', expected: { piece: 'K', target: 'e2' } }
            ];

            testCases.forEach(({ input, expected }) => {
                const result = parseMoveTranscript(input);
                expect(result).toEqual(expected);
            });
        });

        test('should handle invalid move transcripts', () => {
            expect(parseMoveTranscript('invalid move')).toBeNull();
            expect(parseMoveTranscript('')).toBeNull();
            expect(parseMoveTranscript('move to nowhere')).toBeNull();
        });
    });

    describe('Color Parsing', () => {
        test('should parse color transcripts correctly', () => {
            expect(parseColorTranscript('white')).toBe(PlayerColor.WHITE);
            expect(parseColorTranscript('black')).toBe(PlayerColor.BLACK);
            expect(parseColorTranscript('light')).toBe(PlayerColor.WHITE);
            expect(parseColorTranscript('dark')).toBe(PlayerColor.BLACK);
        });

        test('should handle invalid color transcripts', () => {
            expect(parseColorTranscript('invalid')).toBeNull();
            expect(parseColorTranscript('')).toBeNull();
            expect(parseColorTranscript('red')).toBeNull();
        });
    });

    describe('Difficulty Parsing', () => {
        test('should parse difficulty transcripts correctly', async () => {
            expect(await parseDifficultyTranscript('easy')).toBe(Difficulty.EASY);
            expect(await parseDifficultyTranscript('medium')).toBe(Difficulty.MEDIUM);
            expect(await parseDifficultyTranscript('hard')).toBe(Difficulty.HARD);
            expect(await parseDifficultyTranscript('beginner')).toBe(Difficulty.EASY);
            expect(await parseDifficultyTranscript('advanced')).toBe(Difficulty.HARD);
        });

        test('should handle invalid difficulty transcripts', async () => {
            expect(await parseDifficultyTranscript('invalid')).toBeNull();
            expect(await parseDifficultyTranscript('')).toBeNull();
            expect(await parseDifficultyTranscript('expert')).toBeNull();
        });
    });

    describe('Move Execution', () => {
        test('should execute pawn move correctly', () => {
            const board = initializeBoard();
            const source: [number, number] = [6, 4]; // e2
            const target: [number, number] = [4, 4]; // e4
            
            const { updatedBoard, capturedPiece } = executeMove(board, source, target);
            
            expect(capturedPiece).toBe(' ');
            expect(updatedBoard[6]?.[4]).toBe(' ');
            expect(updatedBoard[4]?.[4]).toBe('P');
        });

        test('should handle pawn promotion', () => {
            const board = initializeBoard();
            // Set up white pawn near promotion
            board[1]![4] = 'P'; // White pawn at e7
            
            const source: [number, number] = [1, 4]; // e7
            const target: [number, number] = [0, 4]; // e8
            
            const { updatedBoard } = executeMove(board, source, target);
            
            expect(updatedBoard[0]?.[4]).toBe('Q'); // Should promote to queen
        });
    });

    describe('FEN Generation', () => {
        test('should generate correct FEN for initial position', () => {
            const board = initializeBoard();
            const fen = boardToFEN({
                board,
                currentPlayer: PlayerColor.WHITE,
                castlingRights: "KQkq",
                enPassantTarget: "-",
                halfmoveClock: 0,
                fullmoveNumber: 1,
                mode: SessionMode.USER_TURN,
                userColor: PlayerColor.WHITE,
                aiDifficulty: Difficulty.MEDIUM,
                capturedByWhite: [],
                capturedByBlack: [],
                currentFEN: "",
                moveHistory: [],
                isCheck: false,
                isCheckmate: false,
                isStalemate: false,
                gameStartTime: new Date(),
                lastActivityTime: new Date()
            });
            
            expect(fen).toContain('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
            expect(fen).toContain('w KQkq - 0 1');
        });
    });

    describe('Possible Moves', () => {
        test('should find possible pawn moves', () => {
            const board = initializeBoard();
            const targetCoords = algebraicToCoords('e4');
            
            if (targetCoords) {
                const possibleMoves = findPossibleMoves(board, PlayerColor.WHITE, 'P', targetCoords);
                expect(possibleMoves.length).toBeGreaterThan(0);
                
                // Should find the e2 pawn that can move to e4
                const e2Pawn = possibleMoves.find(move => 
                    move.source[0] === 6 && move.source[1] === 4
                );
                expect(e2Pawn).toBeDefined();
            }
        });
    });
}); 