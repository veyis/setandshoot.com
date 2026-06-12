import { getTranslations } from "next-intl/server";
import { TaxonomyTable, type TaxonomyColumn } from "@/components/studio/taxonomy-table";
import {
  deleteTaxonomyAction,
  saveCompetitionAction,
  saveTagAction,
  saveTeamAction,
} from "@/lib/studio/actions/taxonomies";
import { listStudioCompetitions, listStudioTags, listStudioTeams } from "@/lib/studio/taxonomies";

export const dynamic = "force-dynamic";

// Mirror the Payload select labels (proper nouns, no translation needed).
const TIER_OPTIONS = [
  { value: "bundesliga", label: "Bundesliga" },
  { value: "2-bundesliga", label: "2. Bundesliga" },
  { value: "regional", label: "Regional" },
  { value: "youth", label: "Jugend" },
];

export default async function StudioTaxonomiesPage() {
  const [t, teams, competitions, tags] = await Promise.all([
    getTranslations("studio"),
    listStudioTeams(),
    listStudioCompetitions(),
    listStudioTags(),
  ]);

  const teamColumns: TaxonomyColumn[] = [
    { key: "name", label: t("nameLabel"), kind: "text", required: true },
    { key: "shortName", label: t("shortNameLabel"), kind: "text" },
    { key: "city", label: t("cityLabel"), kind: "text" },
    { key: "tier", label: t("tierLabel"), kind: "select", options: TIER_OPTIONS },
  ];
  const competitionColumns: TaxonomyColumn[] = [
    { key: "name", label: t("nameLabel"), kind: "text", required: true },
    { key: "season", label: t("seasonLabel"), kind: "text", required: true },
    { key: "tier", label: t("tierLabel"), kind: "select", options: TIER_OPTIONS },
  ];
  const tagColumns: TaxonomyColumn[] = [
    { key: "nameDe", label: t("nameDeLabel"), kind: "text", required: true },
    { key: "nameEn", label: t("nameEnLabel"), kind: "text" },
    { key: "slug", label: "Slug", kind: "text", required: true },
  ];

  return (
    <main className="space-y-10">
      <section>
        <h2 className="font-display mb-4 text-xl tracking-tight">{t("taxTeams")}</h2>
        <TaxonomyTable
          collection="teams"
          columns={teamColumns}
          rows={teams.map((team) => ({
            id: team.id,
            published: team.published,
            values: {
              name: team.name,
              shortName: team.shortName ?? "",
              city: team.city ?? "",
              tier: team.tier ?? "",
            },
          }))}
          saveAction={saveTeamAction}
          deleteAction={deleteTaxonomyAction}
        />
      </section>
      <section>
        <h2 className="font-display mb-4 text-xl tracking-tight">{t("taxCompetitions")}</h2>
        <TaxonomyTable
          collection="competitions"
          columns={competitionColumns}
          rows={competitions.map((competition) => ({
            id: competition.id,
            published: competition.published,
            values: {
              name: competition.name,
              season: competition.season,
              tier: competition.tier ?? "",
            },
          }))}
          saveAction={saveCompetitionAction}
          deleteAction={deleteTaxonomyAction}
        />
      </section>
      <section>
        <h2 className="font-display mb-4 text-xl tracking-tight">{t("taxTags")}</h2>
        <TaxonomyTable
          collection="tags"
          columns={tagColumns}
          rows={tags.map((tag) => ({
            id: tag.id,
            published: tag.published,
            values: { nameDe: tag.nameDe, nameEn: tag.nameEn ?? "", slug: tag.slug },
          }))}
          saveAction={saveTagAction}
          deleteAction={deleteTaxonomyAction}
        />
      </section>
    </main>
  );
}
