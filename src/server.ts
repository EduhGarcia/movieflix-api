import express from "express";
import { PrismaClient } from "@prisma/client";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc"
        },
        include: {
            languages: true,
            genres: true
        }
    });
    res.json(movies);
});

app.post("/movies", async (req, res) => {

    const { title, genre_id, language_id, oscar_count, release_date } = req.body;

    try {
        const movieWithSameTitle = await prisma.movie.findFirst({ where: { title: { equals: title, mode: "insensitive" } } });

        if (movieWithSameTitle) {
            return res.status(409).send({ message: "Já tem um filme com o mesmo nome cadastrado" });
        }

        await prisma.movie.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date),
            },
        });
    } catch (err) {
        return res.status(501).send({ message: "Falha ao cadastrar um filme" });
    }

    res.status(201).send();
});

app.put("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: { id }
        });

        if (!movie) {
            res.status(404).send({ message: "Filme não encontrado" });
        }

        const data = { ...req.body };
        data.release_date = data.release_date ? new Date(data.release_date) : undefined;

        await prisma.movie.update({
            where: { id },
            data: data
        });
    } catch (err) {
        return res.status(500).send({ message: "Falha ao tentar atualizar o registro do filme" });
    }

    res.status(200).send({ message: "Filme atualizado" });
});

app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({ where: { id } });

        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" });
        }

        await prisma.movie.delete({ where: { id } });

    } catch {
        return res.status(500).send({ message: "Não foi possível deletar o filme" });
    }

    res.status(200).send({ message: "Filme deletado com sucesso" });

});

app.listen(port, () => {
    console.log(`Servidor inicializado na porta ${port}`);
});